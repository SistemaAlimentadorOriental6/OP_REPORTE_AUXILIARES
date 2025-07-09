import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Función para obtener información del dispositivo
export const getDeviceInfo = async () => {
  try {
    // Obtener información del navegador y sistema operativo
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    // Determinar el tipo de dispositivo de forma más precisa
    const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
    const isTablet = /Tablet|iPad/i.test(userAgent);
    let deviceType = 'Desktop';
    
    if (isMobile) {
      deviceType = isTablet ? 'Tablet' : 'Móvil';
    }
    
    // Detectar el sistema operativo
    let os = 'Desconocido';
    if (/Windows/i.test(platform)) os = 'Windows';
    else if (/Mac/i.test(platform)) os = 'MacOS';
    else if (/Linux/i.test(platform)) os = 'Linux';
    else if (/Android/i.test(userAgent)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';
    
    // Obtener información de la red de forma más detallada
    let networkInfo = 'Desconocido';
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType) {
        const speed = {
          'slow-2g': '2G',
          '2g': '2G',
          '3g': '3G',
          '4g': '4G'
        }[connection.effectiveType] || connection.effectiveType.toUpperCase();
        
        networkInfo = connection.type === 'wifi' ? 'WiFi' : speed;
      } else if (connection.type) {
        networkInfo = connection.type === 'wifi' ? 'WiFi' : connection.type.toUpperCase();
      }
    }
    
    // Obtener método de ubicación de forma más precisa
    let locationMethod = 'GPS';
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        });
        
        // Determinar el método basado en la precisión
        if (position.coords.accuracy <= 10) locationMethod = 'GPS (Alta Precisión)';
        else if (position.coords.accuracy <= 100) locationMethod = 'GPS';
        else if (position.coords.accuracy <= 2000) locationMethod = 'GPS + Red';
        else locationMethod = 'Red';
      } catch (error) {
        // Si hay error en GPS, intentar usar la red
        locationMethod = 'Red (Sin GPS)';
      }
    }
    
    // Zona horaria con formato específico
    const timeZone = 'GMT-5 (COT)'; // Forzamos a GMT-5 (COT) para Colombia
    
    const deviceInfo = {
      dispositivo: `${deviceType} (${os})`,
      tipo_red: networkInfo,
      metodo_ubicacion: locationMethod,
      zona_horaria: timeZone
    };

    console.log('Información del dispositivo obtenida:', deviceInfo);
    
    return deviceInfo;
  } catch (error) {
    console.error('Error al obtener información del dispositivo:', error);
    // Valores por defecto más específicos para Colombia
    return {
      dispositivo: 'Sistema',
      tipo_red: 'Red Local',
      metodo_ubicacion: 'Sistema',
      zona_horaria: 'GMT-5 (COT)'
    };
  }
};