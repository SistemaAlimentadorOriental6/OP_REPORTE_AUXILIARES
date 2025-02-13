'use client'

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, MapPin, BarChart2, Loader } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/dropdown-menu"
import { Input } from "../components/Input"

const API_URL = 'http://127.0.0.1:10000/guardar-registro';

const Modal = ({ children, isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const LocationMarker = ({ position, setPosition }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Tu ubicación actual</Popup>
    </Marker>
  );
}

export default function Dashboard() {
  const [registro, setRegistro] = useState('');
  const [lugarIntegraciones, setLugarIntegraciones] = useState('');
  const [userName, setUserName] = useState('');
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);
  const [isLugarModalOpen, setIsLugarModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  const navigate = useNavigate();

  const lugaresIntegracion = [
    'Prado Occidente', 'Prado Oriente', 'Hospital Sur', 'Acevedo', 'La Y', 
    'Tricentenario', 'Hospital Norte', 'Exposiciones', 'La Uva', 'San Antonio', 
    'Universidad', 'Gardel', 'Alejandro - Oriente'
  ];

  const filteredLugares = lugaresIntegracion.filter(lugar =>
    lugar.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocation = useCallback(() => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error obteniendo la geolocalización:', error);
          setError(`Error obteniendo la geolocalización: ${error.message}`);
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocalización no soportada en este navegador.');
      setIsLoading(false);
    }
  }, []);

  const updateLocation = () => {
    setIsUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPosition([latitude, longitude]);
        setIsUpdatingLocation(false);
      },
      (error) => {
        console.error('Error actualizando la geolocalización:', error);
        setError(`Error actualizando la geolocalización: ${error.message}`);
        setIsUpdatingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    const getUserName = async () => {
      try {
        const cedula = localStorage.getItem('userName');
        if (cedula) {
          setUserName(cedula);
        }
      } catch (error) {
        console.error('Error al obtener la cédula del usuario:', error);
      }
    };

    getUserName();
    getLocation();
  }, [getLocation]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (registro === '' || lugarIntegraciones === '') {
      setError('Debe seleccionar una opción para el registro y el lugar/integración');
      setIsErrorModalOpen(true);
      return;
    }

    if (!position) {
      setError('No se pudo obtener la ubicación.');
      setIsErrorModalOpen(true);
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const confirmEnviar = async () => {
    setIsConfirmModalOpen(false);
    setIsMapModalOpen(true);
  };

  const finalConfirmEnviar = async () => {
    setIsMapModalOpen(false);
    setIsLoading(true);
    try {
      const response = await axios.post(API_URL, {
        cedula: userName,
        opcion: registro,
        lugar: lugarIntegraciones,
        latitud: position[0],
        longitud: position[1]
      });

      if (response.data.success) {
        setIsSuccessModalOpen(true);
      } else {
        setError('Hubo un problema al enviar los datos');
        setIsErrorModalOpen(true);
      }
    } catch (error) {
      console.error('Error enviando los datos:', error);
      setError('Hubo un problema con el servidor');
      setIsErrorModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualizarDatos = () => {
    if (userName === '1035126774') {
      navigate('/datos');
    } else {
      setError('No tienes acceso a esta función.');
      setIsErrorModalOpen(true);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background-color: rgba(52, 211, 153, 0.5);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: rgba(52, 211, 153, 0.8);
        }
        ::-webkit-scrollbar-track {
          background-color: rgba(229, 231, 235, 0.5);
          border-radius: 4px;
        }
      `}</style>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            className="absolute top-4 right-4 bg-white text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-full shadow-md flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="mr-2 h-5 w-5" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white w-56">
          <DropdownMenuItem onClick={() => navigate('/maps')} className="bg-white flex items-center p-2 hover:bg-emerald-100">
            <MapPin className="mr-2 h-5 w-5 text-emerald-600" />
            <span>Ver Mapa</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleVisualizarDatos} className="bg-white flex items-center p-2 hover:bg-emerald-100">
            <BarChart2 className="mr-2 h-5 w-5 text-emerald-600" />
            <span>Visualizar Datos</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      >
        <motion.div 
          className="bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
          whileHover={{ boxShadow: "0 0 30px rgba(52, 211, 153, 0.3)" }}
          transition={{ duration: 0.3 }}
        >
          <div className="p-8">
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.img
                src="/sao6.png"
                alt="Tu App Logo"
                className="h-24 w-auto drop-shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              />
            </motion.div>
            <motion.h1 
              className="text-3xl font-bold text-emerald-800 text-center mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="mb-5 text-left">
                <label className="block text-sm font-medium text-emerald-700">Cédula:</label>
                <input
                  type="text"
                  value={userName || 'Cédula no registrada'}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-50 border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-emerald-800 placeholder-emerald-400"
                />
              </div>

              <form className="mt-4" onSubmit={handleEnviar}>
                <div className="mb-4 text-left">
                  <label htmlFor="tipo-registro" className="block text-sm font-medium text-emerald-700">Reporte: </label>
                  <motion.button
                    type="button"
                    onClick={() => setIsReporteModalOpen(true)}
                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-50 border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-emerald-800 text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {registro || 'Selecciona una opción'}
                  </motion.button>
                </div>

                <div className="mb-4 text-left">
                  <label htmlFor="lugar-integracion" className="block text-sm font-medium text-emerald-700">Lugar de Integración: </label>
                  <motion.button
                    type="button"
                    onClick={() => setIsLugarModalOpen(true)}
                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-50 border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-emerald-800 text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {lugarIntegraciones || 'Seleccione una opción'}
                  </motion.button>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-emerald-500 text-white rounded-lg py-2 font-semibold transition duration-300 ease-in-out transform hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!registro || !lugarIntegraciones || isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin mr-2" />
                      Cargando...
                    </div>
                  ) : (
                    'Enviar'
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <Modal isOpen={isReporteModalOpen} onClose={() => setIsReporteModalOpen(false)}>
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">Selecciona el tipo de reporte</h2>
        <div className="space-y-2">
          {['Entrada', 'Salida'].map((opcion) => (
            <motion.button
              key={opcion}
              onClick={() => {
                setRegistro(opcion);
                setIsReporteModalOpen(false);
              }}
              className="w-full px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-left hover:bg-emerald-50 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
            </motion.button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isLugarModalOpen} onClose={() => setIsLugarModalOpen(false)}>
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">Selecciona el lugar de integración</h2>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Buscar lugar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {filteredLugares.map((opcion) => (
            <motion.button
              key={opcion}
              onClick={() => {
                setLugarIntegraciones(opcion);
                setIsLugarModalOpen(false);
              }}
              className="w-full px-4 py-2 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-left hover:bg-emerald-50 transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {opcion.toUpperCase()}
            </motion.button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">Confirmar envío</h2>
        <p className="mb-4 text-gray-800">¿Estás seguro de que deseas enviar los siguientes datos?</p>
        <p className='mb-4 text-black'><strong>Reporte:</strong> {registro}</p>
        <p className='mb-4 text-black'><strong>Lugar de Integración:</strong> {lugarIntegraciones}</p>
        <div className="flex justify-end mt-6">
          <motion.button
            onClick={() => setIsConfirmModalOpen(false)}
            className="bg-gray-300 text-gray-800 rounded-lg py-2 px-4 font-semibold mr-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancelar
          </motion.button>
          <motion.button
            onClick={confirmEnviar}
            className="bg-emerald-500 text-white rounded-lg py-2 px-4 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Confirmar
          </motion.button>
        </div>
      </Modal>

      <Modal isOpen={isMapModalOpen} onClose={() => setIsMapModalOpen(false)}>
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">Confirma tu ubicación</h2>
        <div className="w-full h-64 mb-4">
          {position && (
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          )}
        </div>
        <p className="mb-4 text-gray-800">¿Es esta tu ubicación actual?</p>
        <div className="flex justify-center gap-4 mt-6">
          <motion.button
            onClick={updateLocation}
            className="bg-blue-500 text-white rounded-lg py-2 px-4 font-semibold flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isUpdatingLocation}
          >
            {isUpdatingLocation ? 'Actualizando...' : 'Actualizar ubicación'}
          </motion.button>
          <motion.button
            onClick={() => setIsMapModalOpen(false)}
            className="bg-gray-300 text-gray-800 rounded-lg py-2 px-4 font-semibold flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cancelar
          </motion.button>
          <motion.button
            onClick={finalConfirmEnviar}
            className="bg-emerald-500 text-white rounded-lg py-2 px-4 font-semibold flex-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Confirmar y Enviar
          </motion.button>
        </div>
      </Modal>

      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">¡Éxito!</h2>
          <p className="mb-4">Los datos se han enviado correctamente.</p>
          <motion.button
            onClick={() => setIsSuccessModalOpen(false)}
            className="w-full bg-emerald-500 text-white rounded-lg py-2 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cerrar
          </motion.button>
        </motion.div>
      </Modal>

      <Modal isOpen={isErrorModalOpen} onClose={() => setIsErrorModalOpen(false)}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <motion.button
            onClick={() => setIsErrorModalOpen(false)}
            className="w-full bg-red-500 text-white rounded-lg py-2 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Cerrar
          </motion.button>
        </motion.div>
      </Modal>
    
    </motion.div>
  );
}