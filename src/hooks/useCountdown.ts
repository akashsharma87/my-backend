import { useState, useEffect, useRef, useMemo } from 'react';

interface CountdownResult {
  timeLeft: number;
  formattedTime: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export const useCountdown = (targetDate: string | null): CountdownResult => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Only update timer if we have a valid target date
  useEffect(() => {
    if (!targetDate) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const target = new Date(targetDate).getTime();
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update immediately
    setCurrentTime(Date.now());

    // Set up interval only if not expired
    const now = Date.now();
    if (target > now) {
      intervalRef.current = setInterval(() => {
        const newTime = Date.now();
        setCurrentTime(newTime);
        
        // Clear interval if expired
        if (newTime >= target) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetDate]);

  // Memoize calculations to prevent unnecessary re-renders
  const result = useMemo((): CountdownResult => {
    if (!targetDate) {
      return {
        timeLeft: 0,
        formattedTime: '',
        isExpired: true,
        isExpiringSoon: false
      };
    }

    const target = new Date(targetDate).getTime();
    const timeLeft = Math.max(0, target - currentTime);
    const isExpired = timeLeft <= 0;
    
    if (isExpired) {
      return {
        timeLeft: 0,
        formattedTime: 'Expired',
        isExpired: true,
        isExpiringSoon: false
      };
    }

    // Calculate time components
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Format the countdown
    let formattedTime = '';
    if (days > 0) {
      formattedTime = `${days} day${days !== 1 ? 's' : ''} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Add expiration date
    const expirationDate = new Date(targetDate);
    const formattedDate = expirationDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    formattedTime += ` — Expires Date: ${formattedDate}`;

    // Check if expiring soon (less than 24 hours)
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const isExpiringSoon = hoursLeft <= 24;

    return {
      timeLeft,
      formattedTime,
      isExpired: false,
      isExpiringSoon
    };
  }, [targetDate, currentTime]);

  return result;
};

export default useCountdown;
