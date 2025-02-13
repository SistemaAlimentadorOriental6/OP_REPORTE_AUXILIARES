import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs"
import { Input } from "../components/Input"
import { Button } from '../components/Button'
import { Label } from "../components/Label"

const API_URL = 'http://127.0.0.1:10000/verificar-cedula';

const loginMessages = [
  "Ingresa tu cédula para comenzar."
]

export default function LoginScreen() {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cedula, setCedula] = useState('')
  const [fullName, setFullName] = useState('')
  const [registerCedula, setRegisterCedula] = useState('')
  const [error, setError] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (isNaN(Number(cedula))) {
      setError('La cédula debe ser un número válido')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await axios.post(API_URL, { cedula })
      const { success, message } = response.data

      if (success) {
        localStorage.setItem('userName', cedula)
        navigate('/dashboard')
      } else {
        setError(message)
      }
    } catch (error) {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!fullName.trim()) {
      setRegisterError('Por favor, ingrese su nombre completo.')
      return
    }
    if (isNaN(Number(registerCedula))) {
      setRegisterError('La cédula debe ser un número válido')
      return
    }
  
    setIsRegistering(true)
    setRegisterError('')
  
    try {
      const response = await axios.post('http://127.0.0.1:10000/guardar-nuevo-registro', {
        nombre: fullName,
        cedula: registerCedula
      })
      const { success, message } = response.data
  
      if (success) {
        navigate('/dashboard')
      } else {
        setRegisterError(message)
      }
    } catch (error) {
      setRegisterError('No se pudo completar el registro. Por favor, inténtelo de nuevo.')
    } finally {
      setIsRegistering(false)
    }
  }
  

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
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
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AnimatePresence mode='wait'>
                  <motion.p 
                    key={index}
                    className="text-lg text-emerald-700 text-center font-medium mb-6"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                  >
                    {loginMessages[index]}
                  </motion.p>
                </AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-cedula">Cédula</Label>
                      <Input
                        id="login-cedula"
                        type="text"
                        placeholder="Ingresa tu cédula"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                      />
                    </div>
                    {error && (
                      <motion.p
                        className="text-red-500 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {error}
                      </motion.p>
                    )}
                    <Button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Cargando..." : "Iniciar Sesión"}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
              <TabsContent value="register">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">Nombre Completo</Label>
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Ingresa tu nombre completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-cedula">Cédula</Label>
                      <Input
                        id="register-cedula"
                        type="text"
                        placeholder="Ingresa tu cédula"
                        value={registerCedula}
                        onChange={(e) => setRegisterCedula(e.target.value)}
                      />
                    </div>
                    {registerError && (
                      <motion.p
                        className="text-red-500 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {registerError}
                      </motion.p>
                    )}
                    <Button
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? "Registrando..." : "Registrarse"}
                    </Button>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
          <motion.div 
            className="bg-emerald-500 h-1"
            initial={{ width: "0%" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}