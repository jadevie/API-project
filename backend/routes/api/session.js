const express = require('express');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { User } = require('../../db/models');
const router = express.Router();

// Log in
router.post('/', async (req, res, next) => {
    const { credential, password } = req.body;

    const user = await User.login({ credential, password });
    // If there is no user returned from the login static method, then create a "Login failed" error and invoke the next error-handling middleware with it.
    if (!user) {
        const err = new Error('Login failed');
        err.status = 401;
        err.title = 'Login failed';
        err.errors = ['The provided credentials were invalid.'];
        return next(err);
    }

    //  If there is a user returned from the login static method, call setTokenCookie and return a JSON response with the user information.
    await setTokenCookie(res, user);

    return res.json({ user });
});

// Log out
router.delete('/', (_req, res) => {
    res.clearCookie('token');
    return res.json({ message: 'success' });
}
);

router.get('/', restoreUser, (req, res) => {
    const { user } = req;
    if (user) {
        return res.json({
            user: user.toSafeObject()
        });
    } else return res.json({});
});


module.exports = router;
