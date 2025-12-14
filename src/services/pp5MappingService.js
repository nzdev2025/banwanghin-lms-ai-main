// src/services/pp5MappingService.js
// Firebase service for managing PP5 template mapping configuration

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase/firebase';

// Firestore path for PP5 mapping
const PP5_MAPPING_PATH = `artifacts/${appId}/public/data/settings`;
const PP5_MAPPING_DOC_ID = 'pp5Mapping';

/**
 * Default mapping structure for PP5 template
 */
export const DEFAULT_MAPPING_CONFIG = {
    templateName: '',
    uploadedAt: null,
    sheets: {
        studentInfo: {
            sheetName: '',
            startRow: 5,
            columns: {
                studentNumber: '', // เลขที่
                studentId: '',     // เลขประจำตัว
                fullName: '',      // ชื่อ-สกุล
                nationalId: '',    // เลขประจำตัวประชาชน
                nickname: '',      // ชื่อเล่น
                birthDate: '',     // วัน/เดือน/ปี เกิด
            },
        },
        scores: {
            sheetName: '',
            startRow: 8,
            columns: {
                studentNumber: '',  // เลขที่
                fullName: '',       // ชื่อ-สกุล
                term1Indicator: '', // ตัวชี้วัด ภาคเรียน 1
                term1Midterm: '',   // ระหว่างเรียน ภาคเรียน 1
                term1Final: '',     // ปลายภาค ภาคเรียน 1
                term1Total: '',     // รวม ภาคเรียน 1
                term2Indicator: '', // ตัวชี้วัด ภาคเรียน 2
                term2Midterm: '',   // ระหว่างเรียน ภาคเรียน 2
                term2Final: '',     // ปลายปี ภาคเรียน 2
                term2Total: '',     // รวม ภาคเรียน 2
                yearTotal: '',      // รวม 2 ภาค
                gradeLevel: '',     // ระดับผลการเรียน
            },
        },
        attendance: {
            sheetName: '',
            startRow: 7,
            columns: {
                studentNumber: '', // เลขที่
                studentId: '',     // เลขประจำตัว
                nationalId: '',    // เลขประจำตัวประชาชน
                fullName: '',      // ชื่อ-สกุล
                total: '',         // เต็ม
                // Day columns will be dynamically mapped
            },
            dayColumnsStart: '', // Starting column for day attendance (e.g., 'F')
        },
        health: {
            sheetName: '',
            startRow: 3,
            columns: {
                studentNumber: '', // เลขที่
                fullName: '',      // ชื่อ-สกุล
                weight1: '',       // น้ำหนัก พฤษภาคม
                height1: '',       // ส่วนสูง พฤษภาคม
                weight2: '',       // น้ำหนัก สิงหาคม
                height2: '',       // ส่วนสูง สิงหาคม
                weight3: '',       // น้ำหนัก พฤศจิกายน
                height3: '',       // ส่วนสูง พฤศจิกายน
                weight4: '',       // น้ำหนัก กุมภาพันธ์
                height4: '',       // ส่วนสูง กุมภาพันธ์
            },
        },
        basicInfo: {
            sheetName: '',
            cells: {
                schoolName: '',     // ชื่อโรงเรียน (e.g., 'B3')
                affiliation: '',    // สังกัด
                subdistrict: '',    // ตำบล
                district: '',       // อำเภอ
                province: '',       // จังหวัด
                academicYear: '',   // ปีการศึกษา
                gradeLevel: '',     // ระดับชั้น
                classTeacher: '',   // ครูประจำชั้น
                principal: '',      // ผู้อำนวยการ
            },
        },
    },
    version: 1,
};

/**
 * Validate mapping configuration
 * @param {Object} mapping - Mapping configuration to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateMapping = (mapping) => {
    const errors = [];

    if (!mapping) {
        return { isValid: false, errors: ['Mapping configuration is required'] };
    }

    // Check if at least studentInfo sheet is configured
    if (!mapping.sheets?.studentInfo?.sheetName) {
        errors.push('กรุณาเลือก sheet สำหรับข้อมูลนักเรียน');
    }

    // Check if required student columns are mapped
    const requiredStudentColumns = ['studentNumber', 'fullName'];
    requiredStudentColumns.forEach(col => {
        if (!mapping.sheets?.studentInfo?.columns?.[col]) {
            errors.push(`กรุณา map คอลัมน์ "${col === 'studentNumber' ? 'เลขที่' : 'ชื่อ-สกุล'}"`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Save PP5 mapping configuration to Firebase
 * @param {Object} mappingConfig - The mapping configuration to save
 * @returns {Promise<void>}
 */
export const savePp5Mapping = async (mappingConfig) => {
    if (!db) {
        throw new Error('Firebase database not initialized');
    }

    const validation = validateMapping(mappingConfig);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    const docRef = doc(db, PP5_MAPPING_PATH, PP5_MAPPING_DOC_ID);

    await setDoc(docRef, {
        ...mappingConfig,
        updatedAt: serverTimestamp(),
    });
};

/**
 * Load PP5 mapping configuration from Firebase
 * @returns {Promise<Object|null>} - The mapping configuration or null if not found
 */
export const loadPp5Mapping = async () => {
    if (!db) {
        console.warn('Firebase database not initialized');
        return null;
    }

    try {
        const docRef = doc(db, PP5_MAPPING_PATH, PP5_MAPPING_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error loading PP5 mapping:', error);
        return null;
    }
};

/**
 * Delete PP5 mapping configuration from Firebase
 * @returns {Promise<void>}
 */
export const deletePp5Mapping = async () => {
    if (!db) {
        throw new Error('Firebase database not initialized');
    }

    const docRef = doc(db, PP5_MAPPING_PATH, PP5_MAPPING_DOC_ID);
    await deleteDoc(docRef);
};

/**
 * Check if PP5 mapping exists
 * @returns {Promise<boolean>}
 */
export const hasPp5Mapping = async () => {
    const mapping = await loadPp5Mapping();
    return mapping !== null;
};

/**
 * Get mapping status summary
 * @param {Object} mapping - Mapping configuration
 * @returns {Object} - Status summary for UI display
 */
export const getMappingStatus = (mapping) => {
    if (!mapping) {
        return {
            hasMapping: false,
            templateName: null,
            sheetsConfigured: 0,
            totalSheets: 5,
            isComplete: false,
        };
    }

    const sheets = mapping.sheets || {};
    let configuredCount = 0;

    if (sheets.studentInfo?.sheetName) configuredCount++;
    if (sheets.scores?.sheetName) configuredCount++;
    if (sheets.attendance?.sheetName) configuredCount++;
    if (sheets.health?.sheetName) configuredCount++;
    if (sheets.basicInfo?.sheetName) configuredCount++;

    return {
        hasMapping: true,
        templateName: mapping.templateName,
        uploadedAt: mapping.uploadedAt,
        sheetsConfigured: configuredCount,
        totalSheets: 5,
        isComplete: configuredCount >= 2, // At least studentInfo and one more
    };
};

/**
 * Merge partial mapping with existing mapping
 * @param {Object} existingMapping - Existing mapping configuration
 * @param {Object} partialMapping - Partial update
 * @returns {Object} - Merged mapping
 */
export const mergeMapping = (existingMapping, partialMapping) => {
    const base = existingMapping || DEFAULT_MAPPING_CONFIG;

    return {
        ...base,
        ...partialMapping,
        sheets: {
            ...base.sheets,
            ...(partialMapping.sheets || {}),
        },
    };
};
