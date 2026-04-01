/* firebase.js — Firebase RTDB + Auth service */
const FirebaseService = (() => {
  let _db, _auth, _initialized = false;

  function init() {
    if (_initialized) return;
    if (!window.firebase) throw new Error('Firebase SDK not loaded');
    firebase.initializeApp(CONFIG.firebase);
    _auth = firebase.auth();
    _db   = firebase.database();
    _initialized = true;
  }

  function mapAuthError(err) {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential') {
      return new Error('Invalid email or password. Verify your credentials and try again.');
    }
    if (code === 'auth/invalid-email') {
      return new Error('Invalid email format.');
    }
    if (code === 'auth/too-many-requests') {
      return new Error('Too many login attempts. Please wait a moment and try again.');
    }
    return err instanceof Error ? err : new Error('Authentication failed');
  }

  const signIn = async (email, pw) => {
    try {
      return await _auth.signInWithEmailAndPassword(email, pw);
    } catch (err) {
      console.error('Firebase signInWithEmailAndPassword failed:', {
        code: err?.code,
        message: err?.message,
        raw: err
      });
      throw mapAuthError(err);
    }
  };
  const signOut = ()          => _auth.signOut();
  const onAuthChange = (cb)   => _auth.onAuthStateChanged(cb);
  const currentUser  = ()     => _auth.currentUser;

  const read   = (path)       => _db.ref(path).once('value').then(s => s.val());
  const write  = (path, data) => _db.ref(path).set(data);
  const update = (path, data) => _db.ref(path).update(data);
  const remove = (path)       => _db.ref(path).remove();
  const push   = (path, data) => _db.ref(path).push(data).then(r => ({ key: r.key }));
  const newKey = (path)       => _db.ref(path).push().key;

  function stream(path, cb) {
    const ref = _db.ref(path);
    ref.on('value', snap => cb(snap.val()));
    return () => ref.off('value');
  }

  function readList(path) {
    return _db.ref(path).once('value').then(snap => {
      const val = snap.val();
      if (!val) return [];
      return Object.entries(val).map(([id, data]) => ({ id, ...data }));
    });
  }

  return { init, signIn, signOut, onAuthChange, currentUser, read, write, update, remove, push, newKey, stream, readList };
})();
