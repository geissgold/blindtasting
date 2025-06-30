const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendLoginCodeEmail } = require("./sendLoginCodeEmail");
require("dotenv").config();

admin.initializeApp();
const db = admin.firestore();

exports.sendCode = functions.https.onCall(async (data, context) => {
  const { email } = data;
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  await db.doc(`loginCodes/${email}`).set({
    code,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    used: false,
  });

  await sendLoginCodeEmail(email, code);
  return { success: true };
});

exports.getCustomToken = functions.https.onRequest(async (req, res) => {
  const { email } = req.body;
  try {
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
    } catch {
      user = await admin.auth().createUser({ email });
    }
    const token = await admin.auth().createCustomToken(user.uid);
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
