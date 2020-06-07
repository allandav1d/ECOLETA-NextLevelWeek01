import multer from 'multer';
import path from 'path';
import { request } from 'express';
import crypto from 'crypto';

export default {
    storage: multer.diskStorage({
        destination: path.resolve(__dirname, '..', '..', 'uploads', 'usersImages'),
        filename(request, file, callback) {
            const hash = crypto.randomBytes(6).toString('hex');

            const fileName = `${hash}-${file.originalname}`;

            callback(null, fileName);
        }
    }),
};