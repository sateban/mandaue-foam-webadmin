/* firebase.js — Firebase RTDB + Auth service */
const FirebaseService = (() => {
  let _db, _auth, _initialized = false;

  function getConfig() {
    const cfg = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
    if (!cfg || !cfg.firebase) {
      throw new Error('Missing Firebase config. Add config.js for local dev or deploy config.json.');
    }
    return cfg;
  }

  function init() {
    if (_initialized) return;
    if (!window.firebase) throw new Error('Firebase SDK not loaded');
    firebase.initializeApp(getConfig().firebase);
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

  const ADMIN_EMAIL = 'admin@mandaue.com';

  const signIn = async (email, pw) => {
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Unauthorized account. Only the system administrator is allowed to sign in.');
    }
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

  const signOut = () => _auth.signOut();
  
  const onAuthChange = (cb) => {
    _auth.onAuthStateChanged(async (user) => {
      if (user && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.warn('Unauthorized user detected, signing out:', user.email);
        await signOut();
        cb(null);
        return;
      }
      cb(user);
    });
  };

  const currentUser = () => {
    const user = _auth.currentUser;
    if (user && user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return user;
  };

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
/** Expose for components that reference `window.FirebaseService` (e.g. sidebar logout). */
window.FirebaseService = FirebaseService;
