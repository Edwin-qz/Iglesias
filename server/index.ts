import express, { Request, Response } from 'express'
import cors from 'cors'
import { pool, testConnection } from './db'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Ruta de estado de la API
app.get('/api/health', async (_req: Request, res: Response) => {
  const isConnected = await testConnection()
  if (isConnected) {
    res.json({ ok: true, message: 'Conectado a MySQL exitosamente', time: new Date().toISOString() })
  } else {
    res.status(500).json({ ok: false, message: 'Fallo al conectar con MySQL' })
  }
})

// Cargar toda la base de datos para sincronizar con el frontend de Casa Viva
app.get('/api/database', async (_req: Request, res: Response) => {
  try {
    const conn = await pool.getConnection()
    try {
      // 1. Iglesias
      const [churchesRows]: [any[], any] = await conn.query('SELECT * FROM churches ORDER BY name ASC')
      const [schedulesRows]: [any[], any] = await conn.query('SELECT * FROM church_schedules')
      const [timelineRows]: [any[], any] = await conn.query('SELECT * FROM church_history_timeline ORDER BY id ASC')

      const schedulesMap: Record<string, any[]> = {}
      for (const s of schedulesRows) {
        if (!schedulesMap[s.church_id]) schedulesMap[s.church_id] = []
        schedulesMap[s.church_id].push({ day: s.day, time: s.time, label: s.label })
      }

      const timelineMap: Record<string, any[]> = {}
      for (const t of timelineRows) {
        if (!timelineMap[t.church_id]) timelineMap[t.church_id] = []
        timelineMap[t.church_id].push({ year: t.year, event: t.event })
      }

      const churches = churchesRows.map((c) => ({
        id: c.id,
        name: c.name,
        shortName: c.short_name,
        address: c.address,
        colonia: c.colonia,
        lat: Number(c.lat),
        lng: Number(c.lng),
        phone: c.phone,
        email: c.email,
        pastor: c.pastor,
        founded: c.founded,
        description: c.description,
        mission: c.mission,
        logo: c.logo || undefined,
        theme: {
          primary: c.theme_primary,
          deep: c.theme_deep,
          accent: c.theme_accent,
          soft: c.theme_soft,
          tint: c.theme_tint,
        },
        photo: c.photo_src
          ? {
              src: c.photo_src,
              alt: c.photo_alt,
              credit: c.photo_credit,
              license: c.photo_license,
              source: c.photo_source,
              position: c.photo_position || undefined,
            }
          : undefined,
        history: c.history_summary
          ? {
              summary: c.history_summary,
              architecture: c.history_architecture,
              timeline: timelineMap[c.id] || [],
              sources: [],
            }
          : undefined,
        schedules: schedulesMap[c.id] || [],
      }))

      // 2. Usuarios
      const [usersRows]: [any[], any] = await conn.query('SELECT * FROM users')
      const users = usersRows.map((u) => ({
        id: u.id,
        churchId: u.church_id,
        name: u.name,
        email: u.email,
        passwordHash: u.password_hash,
        role: u.role,
        active: Boolean(u.active),
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      }))

      // 3. Miembros y relaciones con ministerios
      const [membersRows]: [any[], any] = await conn.query('SELECT * FROM members ORDER BY first_name ASC')
      const [mmRows]: [any[], any] = await conn.query('SELECT * FROM ministry_members')

      const memberMinistriesMap: Record<string, string[]> = {}
      const ministryMembersMap: Record<string, string[]> = {}

      for (const mm of mmRows) {
        if (!memberMinistriesMap[mm.member_id]) memberMinistriesMap[mm.member_id] = []
        memberMinistriesMap[mm.member_id].push(mm.ministry_id)

        if (!ministryMembersMap[mm.ministry_id]) ministryMembersMap[mm.ministry_id] = []
        ministryMembersMap[mm.ministry_id].push(mm.member_id)
      }

      const members = membersRows.map((m) => {
        const birthDateStr = m.birth_date ? new Date(m.birth_date).toISOString().slice(0, 10) : ''
        const joinedAtStr = m.joined_at ? new Date(m.joined_at).toISOString().slice(0, 10) : ''
        return {
          id: m.id,
          churchId: m.church_id,
          firstName: m.first_name,
          lastName: m.last_name,
          phone: m.phone,
          email: m.email,
          birthDate: birthDateStr,
          joinedAt: joinedAtStr,
          active: Boolean(m.active),
          address: m.address || '',
          notes: m.notes || '',
          ministryIds: memberMinistriesMap[m.id] || [],
        }
      })

      // 4. Ministerios
      const [ministriesRows]: [any[], any] = await conn.query('SELECT * FROM ministries')
      const ministries = ministriesRows.map((min) => ({
        id: min.id,
        churchId: min.church_id,
        name: min.name,
        description: min.description,
        color: min.color,
        coordinatorId: min.coordinator_id,
        memberIds: ministryMembersMap[min.id] || [],
        meetingDay: min.meeting_day,
        meetingTime: min.meeting_time,
      }))

      // 5. Eventos
      const [eventsRows]: [any[], any] = await conn.query('SELECT * FROM events ORDER BY date ASC, time ASC')
      const events = eventsRows.map((ev) => ({
        id: ev.id,
        churchId: ev.church_id,
        title: ev.title,
        type: ev.type,
        date: ev.date ? new Date(ev.date).toISOString().slice(0, 10) : '',
        time: ev.time,
        place: ev.place,
        description: ev.description,
        responsibleId: ev.responsible_id,
        ministryId: ev.ministry_id || undefined,
        status: ev.status,
      }))

      // 6. Asistencia y detalles
      const [attRows]: [any[], any] = await conn.query('SELECT * FROM attendance_records ORDER BY date DESC')
      const [attDetailsRows]: [any[], any] = await conn.query('SELECT * FROM attendance_details')

      const presentMap: Record<string, string[]> = {}
      const absentMap: Record<string, string[]> = {}

      for (const ad of attDetailsRows) {
        if (ad.status === 'presente') {
          if (!presentMap[ad.attendance_id]) presentMap[ad.attendance_id] = []
          presentMap[ad.attendance_id].push(ad.member_id)
        } else {
          if (!absentMap[ad.attendance_id]) absentMap[ad.attendance_id] = []
          absentMap[ad.attendance_id].push(ad.member_id)
        }
      }

      const attendance = attRows.map((att) => ({
        id: att.id,
        churchId: att.church_id,
        eventId: att.event_id,
        date: att.date ? new Date(att.date).toISOString().slice(0, 10) : '',
        notes: att.notes || '',
        recordedBy: att.recorded_by,
        recordedAt: att.recorded_at ? new Date(att.recorded_at).toISOString() : new Date().toISOString(),
        presentIds: presentMap[att.id] || [],
        absentIds: absentMap[att.id] || [],
      }))

      // 7. Donaciones
      const [donationsRows]: [any[], any] = await conn.query('SELECT * FROM donations ORDER BY date DESC')
      const donations = donationsRows.map((don) => ({
        id: don.id,
        churchId: don.church_id,
        date: don.date ? new Date(don.date).toISOString().slice(0, 10) : '',
        amount: Number(don.amount),
        concept: don.concept,
        method: don.method,
        anonymous: Boolean(don.anonymous),
        memberId: don.member_id || undefined,
        note: don.note || undefined,
      }))

      // 8. Anuncios
      const [annRows]: [any[], any] = await conn.query('SELECT * FROM announcements ORDER BY published_at DESC')
      const announcements = annRows.map((ann) => ({
        id: ann.id,
        churchId: ann.church_id,
        title: ann.title,
        body: ann.body,
        category: ann.category,
        publishedAt: ann.published_at ? new Date(ann.published_at).toISOString().slice(0, 10) : '',
        pinned: Boolean(ann.pinned),
        authorId: ann.author_id,
      }))

      // 9. Password Resets
      const [resetsRows]: [any[], any] = await conn.query('SELECT * FROM password_resets')
      const passwordResets = resetsRows.map((r) => ({
        email: r.email,
        code: r.code,
        expiresAt: new Date(r.expires_at).getTime(),
      }))

      res.json({
        version: 4,
        churches,
        users,
        members,
        ministries,
        events,
        attendance,
        donations,
        announcements,
        passwordResets,
      })
    } finally {
      conn.release()
    }
  } catch (error: any) {
    console.error('Error fetching database:', error)
    res.status(500).json({ ok: false, error: error.message })
  }
})

// Sincronización completa de mutaciones hacia MySQL
app.post('/api/database/sync', async (req: Request, res: Response) => {
  const db = req.body
  if (!db || !Array.isArray(db.churches)) {
    return res.status(400).json({ ok: false, message: 'Estructura de datos inválida' })
  }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()

    // Sincronizar iglesias (actualizaciones de ajustes)
    for (const c of db.churches) {
      await conn.query(
        `INSERT INTO churches (id, name, short_name, address, colonia, lat, lng, phone, email, pastor, founded, description, mission, logo, theme_primary, theme_deep, theme_accent, theme_soft, theme_tint)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), short_name = VALUES(short_name), address = VALUES(address),
           colonia = VALUES(colonia), phone = VALUES(phone), email = VALUES(email),
           pastor = VALUES(pastor), founded = VALUES(founded), description = VALUES(description),
           mission = VALUES(mission), logo = VALUES(logo)`,
        [
          c.id, c.name, c.shortName, c.address, c.colonia, c.lat, c.lng, c.phone, c.email,
          c.pastor, c.founded, c.description, c.mission, c.logo || null,
          c.theme.primary, c.theme.deep, c.theme.accent, c.theme.soft, c.theme.tint,
        ],
      )

      if (c.schedules) {
        await conn.query('DELETE FROM church_schedules WHERE church_id = ?', [c.id])
        for (const s of c.schedules) {
          await conn.query(
            'INSERT INTO church_schedules (church_id, day, time, label) VALUES (?, ?, ?, ?)',
            [c.id, s.day, s.time, s.label],
          )
        }
      }
    }

    // Sincronizar usuarios
    for (const u of db.users) {
      await conn.query(
        `INSERT INTO users (id, church_id, name, email, password_hash, role, active)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           church_id = VALUES(church_id), name = VALUES(name), email = VALUES(email),
           password_hash = VALUES(password_hash), role = VALUES(role), active = VALUES(active)`,
        [u.id, u.churchId, u.name, u.email, u.passwordHash, u.role, u.active ? 1 : 0],
      )
    }

    // Sincronizar miembros
    for (const m of db.members) {
      await conn.query(
        `INSERT INTO members (id, church_id, first_name, last_name, phone, email, birth_date, joined_at, address, notes, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           church_id = VALUES(church_id), first_name = VALUES(first_name), last_name = VALUES(last_name),
           phone = VALUES(phone), email = VALUES(email), birth_date = VALUES(birth_date),
           joined_at = VALUES(joined_at), address = VALUES(address), notes = VALUES(notes), active = VALUES(active)`,
        [
          m.id, m.churchId, m.firstName, m.lastName, m.phone, m.email,
          m.birthDate || null, m.joinedAt, m.address || null, m.notes || null, m.active ? 1 : 0,
        ],
      )
    }

    // Sincronizar ministerios y relaciones
    for (const min of db.ministries) {
      await conn.query(
        `INSERT INTO ministries (id, church_id, name, description, color, coordinator_id, meeting_day, meeting_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           church_id = VALUES(church_id), name = VALUES(name), description = VALUES(description),
           color = VALUES(color), coordinator_id = VALUES(coordinator_id),
           meeting_day = VALUES(meeting_day), meeting_time = VALUES(meeting_time)`,
        [
          min.id, min.churchId, min.name, min.description, min.color,
          min.coordinatorId, min.meetingDay, min.meetingTime,
        ],
      )

      if (Array.isArray(min.memberIds)) {
        await conn.query('DELETE FROM ministry_members WHERE ministry_id = ?', [min.id])
        for (const memberId of min.memberIds) {
          await conn.query(
            'INSERT IGNORE INTO ministry_members (ministry_id, member_id) VALUES (?, ?)',
            [min.id, memberId],
          )
        }
      }
    }

    // Sincronizar eventos
    for (const ev of db.events) {
      await conn.query(
        `INSERT INTO events (id, church_id, title, type, date, time, place, description, responsible_id, ministry_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), type = VALUES(type), date = VALUES(date),
           time = VALUES(time), place = VALUES(place), description = VALUES(description),
           responsible_id = VALUES(responsible_id), ministry_id = VALUES(ministry_id), status = VALUES(status)`,
        [
          ev.id, ev.churchId, ev.title, ev.type, ev.date, ev.time, ev.place,
          ev.description, ev.responsibleId, ev.ministryId || null, ev.status,
        ],
      )
    }

    // Sincronizar asistencia
    for (const att of db.attendance) {
      await conn.query(
        `INSERT INTO attendance_records (id, church_id, event_id, date, notes, recorded_by, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           notes = VALUES(notes), recorded_by = VALUES(recorded_by), recorded_at = VALUES(recorded_at)`,
        [att.id, att.churchId, att.eventId, att.date, att.notes || null, att.recordedBy, att.recordedAt],
      )

      await conn.query('DELETE FROM attendance_details WHERE attendance_id = ?', [att.id])
      if (Array.isArray(att.presentIds)) {
        for (const pId of att.presentIds) {
          await conn.query(
            'INSERT IGNORE INTO attendance_details (attendance_id, member_id, status) VALUES (?, ?, ?)',
            [att.id, pId, 'presente'],
          )
        }
      }
      if (Array.isArray(att.absentIds)) {
        for (const aId of att.absentIds) {
          await conn.query(
            'INSERT IGNORE INTO attendance_details (attendance_id, member_id, status) VALUES (?, ?, ?)',
            [att.id, aId, 'ausente'],
          )
        }
      }
    }

    // Sincronizar donaciones
    for (const don of db.donations) {
      await conn.query(
        `INSERT INTO donations (id, church_id, date, amount, concept, method, anonymous, member_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           date = VALUES(date), amount = VALUES(amount), concept = VALUES(concept),
           method = VALUES(method), anonymous = VALUES(anonymous), member_id = VALUES(member_id), note = VALUES(note)`,
        [
          don.id, don.churchId, don.date, don.amount, don.concept, don.method,
          don.anonymous ? 1 : 0, don.memberId || null, don.note || null,
        ],
      )
    }

    // Sincronizar anuncios
    for (const ann of db.announcements) {
      await conn.query(
        `INSERT INTO announcements (id, church_id, title, body, category, published_at, pinned, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title), body = VALUES(body), category = VALUES(category),
           published_at = VALUES(published_at), pinned = VALUES(pinned), author_id = VALUES(author_id)`,
        [
          ann.id, ann.churchId, ann.title, ann.body, ann.category,
          ann.publishedAt, ann.pinned ? 1 : 0, ann.authorId,
        ],
      )
    }

    await conn.commit()
    res.json({ ok: true, message: 'Base de datos sincronizada con MySQL con éxito' })
  } catch (error: any) {
    await conn.rollback()
    console.error('Error syncing database:', error)
    res.status(500).json({ ok: false, error: error.message })
  } finally {
    conn.release()
  }
})

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor backend API escuchando en http://localhost:${PORT}`)
  await testConnection()
})

