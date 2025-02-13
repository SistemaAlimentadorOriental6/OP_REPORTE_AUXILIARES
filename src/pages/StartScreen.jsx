import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const motivationalQuotes = [
  "Cultiva la belleza en tu mente y en tu espíritu.",
  "La simplicidad es la máxima sofisticación.",
  "Encuentra la belleza en cada momento.",
  "Crea tu propio camino y deja una hermosa huella.",
  "La vida es un lienzo, píntala con colores brillantes."
]

export default function StartScreen() {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const navigate = useNavigate()

  const goToNextQuote = useCallback(() => {
    setIndex((prevIndex) => (prevIndex + 1) % motivationalQuotes.length)
  }, [])

  const handleTap = useCallback(() => {
    setTapCount((prevCount) => {
      if (prevCount === 1) {
        navigate('/login')
        return 0
      }
      setTimeout(() => setTapCount(0), 300)
      return prevCount + 1
    })
    goToNextQuote()
  }, [goToNextQuote, navigate])

  useEffect(() => {
    const quoteInterval = setInterval(goToNextQuote, 3000)
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 1) {
          clearInterval(progressInterval)
          navigate('/login')
          return 1
        }
        return prevProgress + 0.1
      })
    }, 1000)

    return () => {
      clearInterval(quoteInterval)
      clearInterval(progressInterval)
    }
  }, [goToNextQuote, navigate])

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4"
      onClick={handleTap}
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
            <motion.h1 
              className="text-3xl font-bold text-emerald-800 text-center mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Bienvenido
            </motion.h1>
            <AnimatePresence mode='wait'>
              <motion.p 
                key={index}
                className="text-lg text-emerald-700 text-center font-medium mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
              >
                {motivationalQuotes[index]}
              </motion.p>
            </AnimatePresence>
            <motion.p
              className="text-sm text-emerald-600 text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              Toca dos veces para continuar
            </motion.p>
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