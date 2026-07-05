"use client";

import { useState, useEffect } from "react";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import syl from "../locales/syl.json";

const resources = { en, fr, syl };

function detectInitialLang() {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("lang");
  if (stored && resources[stored]) return stored;

  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
  const code = nav.toLowerCase();
  if (code.startsWith("fr")) return "fr";
  if (code.startsWith("syl") || code.includes("syl")) return "syl";
  return "en";
}

export function useTranslation() {
  const [lang, setLang] = useState(detectInitialLang);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch (e) {
      // ignore
    }
  }, [lang]);

  const t = (key) => {
    const parts = key.split('.');
    let obj = resources[lang] || resources.en;
    for (const p of parts) {
      if (obj && Object.prototype.hasOwnProperty.call(obj, p)) {
        obj = obj[p];
      } else {
        return key;
      }
    }
    return typeof obj === 'string' ? obj : key;
  };

  const availableLanguages = Object.keys(resources);

  return { t, lang, setLang, availableLanguages };
}
