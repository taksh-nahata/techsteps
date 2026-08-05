import { useEffect, useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import {
  detectGuideDevice,
  GuideDeviceType,
  persistDetectedDevice,
  resolveUserGuideDevice,
} from '../utils/deviceDetection';

/** Active device for flashcards — profile first, then auto-detect */
export function useUserDevice(): GuideDeviceType {
  const { userData } = useUser();

  const device = useMemo(
    () => resolveUserGuideDevice(userData?.primaryDevices),
    [userData?.primaryDevices]
  );

  useEffect(() => {
    persistDetectedDevice(detectGuideDevice());
  }, []);

  return device;
}
