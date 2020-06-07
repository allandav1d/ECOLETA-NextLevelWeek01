import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes';
import { errors } from 'celebrate';

const app = express();

app.use(cors(
    //origin : 'www.domain-aplication.com' //em produção é necessario definir o dominio da aplicação
));
app.use(express.json());
app.use(routes);

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.use('/uploads/usersImages', express.static(path.resolve(__dirname, '..', 'uploads', 'usersImages')));

app.use(errors());

app.listen(3333);