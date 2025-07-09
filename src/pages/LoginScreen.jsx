import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from "framer-motion"
import { User, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "../components/Button"
import { Input } from "../components/Input"
import { Label } from "../components/Label"
import { loginUser } from '../store/slices/authSlice'

const welcomeMessages = [
  "Bienvenido de vuelta",
  "Ingresa tu cédula para continuar",
  "Accede a tu cuenta de forma segura",
]

export default function LoginScreen() {
  const dispatch = useDispatch()
  const { isLoading, error, user } = useSelector((state) => state.auth)
  
  const [messageIndex, setMessageIndex] = useState(0)
  const [cedula, setCedula] = useState("")

  // Rotate welcome messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % welcomeMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirigir al dashboard
      window.location.href = '/dashboard'
    }
  }, [user])

  const handleLogin = async () => {
    if (!cedula.trim() || isNaN(Number(cedula))) {
      return
    }

    try {
      await dispatch(loginUser(cedula)).unwrap()
      // El redirect se maneja en el useEffect de arriba
    } catch (err) {
      // El error se maneja automáticamente por Redux
      console.error('Error de login:', err)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-25 to-green-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-full blur-3xl"
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-l from-emerald-200/25 to-green-200/25 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-green-100/30 to-emerald-100/30 rounded-full blur-2xl"
          animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
    <motion.div 
          key={i}
          className="absolute w-2 h-2 bg-green-300/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Number.POSITIVE_INFINITY,
            delay: Math.random() * 2,
          }}
        />
      ))}

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="bg-white/90 backdrop-filter backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-green-100/50 relative"
          whileHover={{
            boxShadow: "0 0 40px rgba(34, 197, 94, 0.15), 0 0 80px rgba(34, 197, 94, 0.05)",
            scale: 1.01,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-green-500" />

          <div className="p-8 relative">
            {/* Decorative corner elements */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full blur-sm" />
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-tr from-emerald-200/30 to-green-200/30 rounded-full blur-sm" />

            {/* Logo Section */}
            <motion.div 
              className="flex justify-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl"
                  animate={{
                    rotate: 360,
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                  }}
                />
              <motion.img
                src="/sao6.png"
                alt="Tu App Logo"
                  className="h-24 w-auto drop-shadow-xl relative z-10"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
              />
                <motion.div
                  className="absolute top-0 right-0 text-green-400"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Welcome Message */}
            <div className="text-center mb-8">
              <motion.h1
                className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Iniciar Sesión
              </motion.h1>

              <AnimatePresence mode="wait">
                  <motion.p 
                  key={messageIndex}
                  className="text-green-600 text-sm font-medium px-4"
                  initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.6 }}
                >
                  {welcomeMessages[messageIndex]}
                  </motion.p>
                </AnimatePresence>
            </div>

            {/* Login Form */}
                <motion.div
              className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
                >
              {/* Cedula Input */}
                    <div className="space-y-2">
                <Label htmlFor="cedula" className="text-green-700 text-sm font-semibold">
                  Cédula
                </Label>
                <motion.div className="relative" whileFocusWithin={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5 z-10" />
                      <Input
                    id="cedula"
                        type="text"
                        placeholder="Ingresa tu cédula"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400/30 bg-white/80 backdrop-blur-sm h-12 rounded-xl transition-all duration-300 hover:bg-white/90"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400/5 to-emerald-400/5 pointer-events-none" />
                </motion.div>
              </div>



              {/* Error Message */}
              <AnimatePresence>
                    {error && (
                  <motion.div
                    className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl p-4"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-600 text-sm font-medium">
                      {error || (!cedula.trim() || isNaN(Number(cedula)) ? "Por favor ingresa una cédula válida" : "")}
                    </p>
                  </motion.div>
                )}
                {(!cedula.trim() || isNaN(Number(cedula))) && cedula && (
                  <motion.div
                    className="bg-red-50/80 backdrop-blur-sm border border-red-200/60 rounded-xl p-4"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-600 text-sm font-medium">Por favor ingresa una cédula válida</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                    <Button
                      onClick={handleLogin}
                      disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-semibold py-4 h-14 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {isLoading ? (
                <motion.div
                      className="flex items-center justify-center relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                    >
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      Iniciando sesión...
                    </motion.div>
                  ) : (
                    <span className="flex items-center justify-center relative z-10">
                      Iniciar Sesión
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Forgot Password */}
              <div className="text-center pt-2">
                <motion.button
                  className="text-green-600 hover:text-green-800 text-sm transition-colors font-medium hover:underline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ¿Olvidaste tu contraseña?
                </motion.button>
                  </div>
                </motion.div>
          </div>

          {/* Enhanced animated bottom border */}
          <motion.div 
            className="h-1 bg-gradient-to-r from-green-400 via-emerald-400 via-green-500 to-emerald-400"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 1 }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
