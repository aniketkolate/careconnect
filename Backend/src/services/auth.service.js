const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ROLES } = require('../utils/constants');

exports.register = async ({ name, email, password, phone, role }) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Email uniqueness
        const exists = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        if (exists.rows.length > 0) {
            throw { status: 409, message: 'Email already registered' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userRes = await client.query(
            `INSERT INTO users (name, email, password, phone, role, is_active)
       VALUES ($1,$2,$3,$4,$5,true)
       RETURNING id, role`,
            [name, email, hashedPassword, phone, role]
        );

        const userId = userRes.rows[0].id;

        if (role === ROLES.CARE_SEEKER) {
            await client.query(
                'INSERT INTO care_seeker_profiles (user_id, is_profile_completed) VALUES ($1,false)',
                [userId]
            );
        }

        if (role === ROLES.CARE_TAKER) {
            await client.query(
                'INSERT INTO care_taker_profiles (user_id, is_profile_completed) VALUES ($1,false)',
                [userId]
            );
        }

        await client.query('COMMIT');
        return userRes.rows[0];

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.login = async ({ email, password }) => {
    const result = await pool.query(
        'SELECT id, password, role, is_active FROM users WHERE email=$1',
        [email]
    );

    if (result.rows.length === 0) {
        throw { status: 401, message: 'Invalid email or password' };
    }

    const user = result.rows[0];

    if (!user.is_active) {
        throw { status: 403, message: 'Account is deactivated' };
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw { status: 401, message: 'Invalid email or password' };
    }
    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
    return { token, role: user.role };
};
