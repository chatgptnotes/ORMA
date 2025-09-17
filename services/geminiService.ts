
import { GoogleGenAI, Type } from "@google/genai";
import { PassportData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const passportSchema = {
    type: Type.OBJECT,
    properties: {
        surname: { type: Type.STRING, description: "Surname(s) of the holder.", nullable: true },
        givenName: { type: Type.STRING, description: "Given name(s) of the holder.", nullable: true },
        sex: { type: Type.STRING, description: "Sex/Gender of the holder (M, F, or X).", nullable: true },
        dateOfBirth: { type: Type.STRING, description: "Date of birth in DD/MM/YYYY format.", nullable: true },
        placeOfBirth: { type: Type.STRING, description: "Place of birth of the holder.", nullable: true },
        dateOfIssue: { type: Type.STRING, description: "Date of issue of the passport in DD/MM/YYYY format.", nullable: true },
        dateOfExpiry: { type: Type.STRING, description: "Date of expiry of the passport in DD/MM/YYYY format.", nullable: true },
        placeOfIssue: { type: Type.STRING, description: "Place where the passport was issued.", nullable: true },
        passportNumber: { type: Type.STRING, description: "The passport number.", nullable: true },
        fatherName: { type: Type.STRING, description: "Name of the holder's father.", nullable: true },
        motherName: { type: Type.STRING, description: "Name of the holder's mother.", nullable: true },
        spouseName: { type: Type.STRING, description: "Name of the holder's spouse.", nullable: true },
        address: { type: Type.STRING, description: "The full address of the holder.", nullable: true },
        fileNumber: { type: Type.STRING, description: "The file number.", nullable: true },
        mrzLine1: { type: Type.STRING, description: "The first line of the Machine Readable Zone (MRZ).", nullable: true },
        mrzLine2: { type: Type.STRING, description: "The second line of the Machine Readable Zone (MRZ).", nullable: true },
    },
    required: ["surname", "givenName", "sex", "dateOfBirth", "placeOfBirth", "dateOfIssue", "dateOfExpiry", "placeOfIssue", "passportNumber", "mrzLine1", "mrzLine2"]
};


export const extractPassportData = async (base64Image: string, mimeType: string): Promise<PassportData> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        text: `You are an expert Optical Character Recognition (OCR) system specializing in identity documents. 
                        Analyze the provided image of a passport and extract all key information. 
                        Format the output as a JSON object that strictly adheres to the provided schema. 
                        Do not include any explanatory text, markdown formatting, or any content outside of the final JSON object.
                        If a field is not visible or cannot be determined, use a null value for that field.`
                    },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image,
                        },
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: passportSchema,
            },
        });

        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText);

        return data as PassportData;

    } catch (error) {
        console.error("Error extracting passport data:", error);
        throw new Error("Failed to analyze the passport image. The image may be unclear or the format is not supported.");
    }
};
