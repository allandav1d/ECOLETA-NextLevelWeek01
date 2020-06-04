import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';
import logo from '../../assets/logo.svg';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const CreatePoint = () => {
    //Estado para array ou objeto devemos sempre informar o tipo da variavel
    interface Item{id:number, title:string, image_url:string}
    interface IBGEUFResponse {sigla: string; nome:string;}
    interface IBGECityResponse {nome:string;}

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number,number]>([0,0]);
    const [initialPosition, setInitialPosition] = useState<[number,number]>([0,0]);
    const [sucessSubmit, setSucessSubmit] = useState(false);
    const history = useHistory();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);
        });
    }, []);

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
                const ufInitials = response.data.map(uf => uf.sigla);
                setUfs(ufInitials);
        });
    }, []);

    useEffect(() => {
        //Carregar as cidades sempre que a UF mudar
        if(selectedUf === '0'){
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`).then(response => {
                const cityNames = response.data.map(city => city.nome);
                setCities(cityNames);
        });
    }, [selectedUf]);

    function handleSelectUF(e: ChangeEvent<HTMLSelectElement>){
        const uf = e.target.value;
        setSelectedUf(uf);
    }

    function handleSelectCity(e: ChangeEvent<HTMLSelectElement>){
        const city = e.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(e: LeafletMouseEvent){
        setSelectedPosition([e.latlng.lat, e.latlng.lng]);
    }

    function handleInputChange(e: ChangeEvent<HTMLInputElement>){
        const { name, value }  = e.target;
        setFormData({ ...formData, [name]: value });
    }

    async function handleSubmit(e: FormEvent){
        e.preventDefault();
        const { name, email, whatsapp } = formData;
        const uf =selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name, email, whatsapp, uf, city, latitude, longitude, items
        };


        await api.post('points', data);
        setSucessSubmit(true);

        sleep(4000).then(() => { 
            history.push('/');
        });
        //
    }

    function handleSelectItem(id: number){
        const alreadySelected = selectedItems.findIndex(item => item === id);

        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        }else{
            setSelectedItems([...selectedItems, id]);
        }
    }

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    return(
        <div id="page-create-point">
            <div className={sucessSubmit ? 'is-success':'hide'}>
                <div className="alert">
                    <FiCheckCircle className="check-icon"/>
                    <h2>Cadastro concluído!</h2>
                </div>
            </div>


            <header>
                <img src={logo} alt=""/>
                <Link to="/">
                    <FiArrowLeft /> Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br/> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}/>
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                        </div>
                    </div>

                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no  mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer 
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition}/>
                    </Map> 

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select onChange={handleSelectUF} value={selectedUf} name="uf" id="uf">
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select onChange={handleSelectCity} value={selectedCity} name="city" id="city">
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                    </div> 
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>Selecione um ou mais items a baixo</span>
                    </legend>
                    
                    <ul className="items-grid">
                        {items.map(item => (
                            <li 
                                key={item.id} 
                                className={selectedItems.includes(item.id) ? 'selected':''}
                                onClick={() => handleSelectItem(item.id)}>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>
        </div>
    );
}

export default CreatePoint;