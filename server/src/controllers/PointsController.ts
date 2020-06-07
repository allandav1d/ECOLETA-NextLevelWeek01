import { Request, Response } from 'express';
import knex from '../database/connection';

class PointsController{
    async index (request: Request, response: Response) {
        //Sempre que for filtrar pegar dos Query params
        const { city,  uf, items } = request.query;

        const parsedItems = String(items)
        .split(',')
        .map(item => Number(item.trim()));

        const points = await knex('points')
        .join('point_items', 'points.id', '=', 'point_items.item_id')
        .whereIn('point_items.item_id', parsedItems)
        .where('city', String(city))
        .where('uf', String(uf))
        .distinct()
        .select('points.*');
        
        //criar metodo utils e reaproveitar
        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.0.5:3333/uploads/usersImages/${point.image}`
            }
        });

        return response.json(serializedPoints);
    }

    async show (request: Request, response: Response) {
        const { id } = request.params;

        const point = await knex('points').where('id',id).first();

        if(!point){
            return response.status(400).json({message: 'Point not found.'});
        }

        const serializedPoint ={
                ...point,
                image_url: `http://192.168.0.5:3333/uploads/usersImages/${point.image}`
        }

        const items = await knex('items')
        .join('point_items', 'items.id', '=', 'point_items.item_id')
        .where('point_items.point_id', id).select('items.title');

        return response.json({point: serializedPoint,items});
    }

    async create (request: Request, response: Response) {
        const {
            name,        email,        whatsapp,
            latitude,        longitude,        city,        uf,
            items
        } = request.body;
    
        //Aguarda retorno das duas transações antes de inserir no banco
        const trx = await knex.transaction();
    
        const point = {
            image: request.file.filename,
            name,        email,        whatsapp,
            latitude,        longitude,        city,        uf
        };

        const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
    
        //Cria um array com uma relação item pra cada selecionado
        const pointItems = items.split(',').map((item : string) => Number(item.trim())).map((item_id: number) => {
            return{
                item_id,
                point_id,
            }
        })
    
        //adiciona pontos selecionados na tabela de chaves
        await trx('point_items').insert(pointItems);
        
        //Finaliza a transação
        await trx.commit();
    
        return response.json({
            id: point_id,
            ...point,
        });
    }

}

export default PointsController;