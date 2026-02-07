export interface Instruction {
    title: string;
    description: string;
}

export const emotionInstructions: { [key: string]: Instruction } = {
    neutral: {
        title: "😐 NEYTRAL (Neutral)",
        description: "Iltimos, gapni odatiy holatda, hissiyotsiz va sokin ohangda o‘qing. Ovozingiz tabiiy va barqaror bo‘lsin."
    },
    calm: {
        title: "😌 XOTIRJAM (Calm)",
        description: "Iltimos, gapni sekinroq, yumshoq va tinch ohangda o‘qing. Ovozingizda vazminlik va osoyishtalik sezilsin."
    },
    happy: {
        title: "😀 XURSAND (Happy)",
        description: "Iltimos, gapni quvonch bilan, biroz balandroq va jonli ohangda o‘qing. Ovozingizda ijobiy kayfiyat sezilsin."
    },
    sad: {
        title: "😔 G‘AMGIN (Sad)",
        description: "Iltimos, gapni sekinroq, pastroq ohangda va sokin tarzda o‘qing. Ovozingizda xafalik va tushkunlik sezilsin."
    },
    angry: {
        title: "😠 G‘AZAB (Angry)",
        description: "Iltimos, gapni qat’iy, keskin va biroz kuchli ohangda o‘qing. Ovozingizda jahldorlik sezilsin, lekin baqirmang."
    },
    fearful: {
        title: "😨 QO‘RQUV (Fear)",
        description: "Iltimos, gapni xavotir va ishonchsizlik bilan, shoshmasdan o‘qing. Ovozingizda qo‘rquv va bezovtalik sezilsin."
    },
    disgust: {
        title: "🤢 JIRKANISH (Disgust)",
        description: "Iltimos, gapni yoqimsizlik hissi bilan, sovuq yoki befarq ohangda o‘qing. Ovozingizda norozilik sezilsin."
    },
    surprised: {
        title: "😲 HAYRAT (Surprise)",
        description: "Iltimos, gapni hayron qolgan holda, ohangni biroz o‘zgartirib va jonli tarzda o‘qing. Ovozingizda kutilmaganlik sezilsin."
    },
};

export const importantNote = {
    title: "⚠️ MUHIM ESLATMA",
    description: "Ushbu ovoz yozish jarayoni aktyorlik asosida amalga oshiriladi. Sizdan real hissiy holat talab etilmaydi. Agar o‘zingizni noqulay his qilsangiz, istalgan vaqtda jarayonni to‘xtatishingiz mumkin."
}
