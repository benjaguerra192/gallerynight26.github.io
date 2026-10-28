(() => {
  const config = window.GALLERY_SUPABASE;
  if (!config?.url || !config?.key) { window.galleryCloud = null; return; }
  const options = storageKey => ({ auth: { storageKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  const participant = supabase.createClient(config.url, config.key, options('gallery-participant-session'));
  const admin = supabase.createClient(config.url, config.key, options('gallery-admin-session'));
  async function rpc(client, name, values = {}) {
    const { data, error } = await client.rpc(name, values);
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    return data;
  }
  window.galleryCloud = {
    async me() {
      const { data, error } = await participant.auth.getSession();
      if (error) throw error;
      return data.session ? rpc(participant, 'gn_me') : { participant: null, event: await rpc(participant, 'gn_status') };
    },
    async register(name) {
      const { data, error } = await participant.auth.getSession();
      if (error) throw error;
      if (!data.session) {
        const result = await participant.auth.signInAnonymously();
        if (result.error) throw result.error;
      }
      return rpc(participant, 'gn_register', { participant_name: name });
    },
    unlock: id => rpc(participant, 'gn_unlock', { track: id }),
    async restoreAdmin() {
      const { data, error } = await admin.auth.getSession();
      if (error) throw error;
      return data.session ? rpc(admin, 'gn_admin_snapshot') : null;
    },
    async login(email, password) {
      const { error } = await admin.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === 'invalid_credentials') throw new Error('Email o contraseña incorrectos.');
        if (error.code === 'email_not_confirmed') throw new Error('Confirmá tu email antes de entrar.');
        if (error.status === 429) throw new Error('Demasiados intentos. Esperá un momento antes de volver a entrar.');
        throw new Error('No se pudo iniciar sesión. Revisá la conexión o el estado de Supabase.');
      }
      return rpc(admin, 'gn_admin_snapshot');
    },
    async logout() {
      const { error } = await admin.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
    leaderboard: () => rpc(participant, 'gn_leaderboard'),
    snapshot: () => rpc(admin, 'gn_admin_snapshot'),
    event: (mode, opens, closes) => rpc(admin, 'gn_admin_event', { event_mode: mode, open_time: opens, close_time: closes }),
    action: (action, target = null, track = null, confirmed = false) => rpc(admin, 'gn_admin_action', {
      action, target, track, confirmation: confirmed ? 'BORRAR' : null
    })
  };
})();
