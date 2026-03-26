import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ReleaseNoteType, ColumnDefinition } from '../types/releaseNote';

const CONFIG_COLLECTION = 'releaseConfigs';

export interface SheetConfig {
    type: ReleaseNoteType;
    columns: ColumnDefinition[];
    lockedDates: string[];
}

export const getSheetConfig = async (type: string): Promise<SheetConfig | null> => {
    const docRef = doc(db, CONFIG_COLLECTION, type);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as SheetConfig;
    }
    return null;
};

export const saveSheetConfig = async (config: SheetConfig) => {
    const docRef = doc(db, CONFIG_COLLECTION, config.type);
    await setDoc(docRef, config);
};

export const getSheets = async (): Promise<any[] | null> => {
    const docRef = doc(db, CONFIG_COLLECTION, 'sheets');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().sheets;
    }
    return null;
};

export const saveSheets = async (sheets: any[]) => {
    const docRef = doc(db, CONFIG_COLLECTION, 'sheets');
    await setDoc(docRef, { sheets });
};
