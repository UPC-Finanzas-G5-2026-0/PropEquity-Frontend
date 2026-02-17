import React from 'react';
import Sidebar from '../components/Sidebar';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const PropertyRegistrationPage = () => {
    return (
        <div className="flex bg-gray-50 min-h-screen">
            <Sidebar />

            <main className="flex-1 p-12">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Unidad Inmobiliaria</h1>
                    <p className="text-gray-600 text-lg">Ingresa los datos técnicos y financieros de la propiedad</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Detalles de la Ubicación */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">Detalles de la Ubicación</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Código de Unidad</label>
                                <input
                                    type="text"
                                    placeholder="EJ: DPTO-204-B"
                                    className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400"
                                />
                                <p className="text-xs text-gray-400 mt-1 ml-1 font-light">Debe ser único en el sistema</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Dirección Exacta</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LocationOnIcon className="text-gray-900" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Av. Javier Prado Oeste 123"
                                        className="w-full bg-gray-100 border-none rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Distrito</label>
                                <div className="relative">
                                    <select className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 appearance-none focus:ring-2 focus:ring-brand-blue outline-none transition-all text-gray-500">
                                        <option>Seleccionar</option>
                                        <option>Miraflores</option>
                                        <option>San Isidro</option>
                                        <option>Santiago de Surco</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <KeyboardArrowDownIcon className="text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detalles Financieros */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">Detalles Financieros</h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Precio</label>
                                <div className="flex gap-3">
                                    <div className="relative w-1/4">
                                        <select className="w-full bg-gray-100 border-none rounded-lg py-3 px-4 appearance-none focus:ring-2 focus:ring-brand-blue outline-none transition-all text-gray-500">
                                            <option>S/.</option>
                                            <option>$</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                            <KeyboardArrowDownIcon size="small" className="text-gray-500" />
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="flex-1 bg-gray-100 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400 text-right"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Área</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="w-1/3 bg-gray-100 border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-brand-blue outline-none transition-all placeholder:text-gray-400 text-center"
                                    />
                                    <span className="text-xl font-medium text-gray-700">m²</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Foto</label>
                                <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 hover:border-brand-blue transition-colors cursor-pointer overflow-hidden">
                                    <div className="w-full h-full bg-gray-300"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-16 rounded-2xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-xl">
                        Guardar Propiedad
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PropertyRegistrationPage;
