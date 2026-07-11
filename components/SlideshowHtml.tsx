"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const DURATION = 5000;
const FAST_DURATION = 600;

const SVG_STYLE: React.CSSProperties = { width: "100%", borderRadius: 6 };
const NAV_BTN_STYLE: React.CSSProperties = {
  fontSize: 12, padding: "5px 12px", borderRadius: 3,
  border: "1.5px solid #C8A87A", background: "#FFFBF5", color: "#8B5E3C",
  cursor: "pointer", fontFamily: "Georgia, serif", fontStyle: "italic",
};
const WALLPAPER_TOP = "repeating-linear-gradient(90deg,#C8809A 0px,#C8809A 6px,#E8B4BC 6px,#E8B4BC 12px,#8FAF8A 12px,#8FAF8A 18px,#E8D5BC 18px,#E8D5BC 24px,#C8809A 24px,#C8809A 30px,#F6C026 30px,#F6C026 36px,#E8B4BC 36px,#E8B4BC 42px,#8FAF8A 42px,#8FAF8A 48px)";
const WALLPAPER_BTM = "repeating-linear-gradient(90deg,#8FAF8A 0px,#8FAF8A 6px,#F6C026 6px,#F6C026 12px,#C8809A 12px,#C8809A 18px,#E8B4BC 18px,#E8B4BC 24px,#5BA8A0 24px,#5BA8A0 30px,#E8D5BC 30px,#E8D5BC 36px,#8FAF8A 36px,#8FAF8A 42px,#C8809A 42px,#C8809A 48px)";

const SLIDES: { svg: React.ReactNode; caption: string }[] = [
  {
    caption: "✅ Your worker will show up on time — or you'll get a window free.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF8EE"/>
        <rect x="0" y="200" width="520" height="80" fill="#C8DEB0"/>
        <rect x="0" y="220" width="520" height="60" fill="#A8C890"/>
        <ellipse cx="80" cy="50" rx="40" ry="18" fill="white" opacity="0.9"/>
        <ellipse cx="110" cy="42" rx="28" ry="16" fill="white" opacity="0.85"/>
        <ellipse cx="55" cy="44" rx="24" ry="14" fill="white" opacity="0.85"/>
        <ellipse cx="380" cy="40" rx="36" ry="16" fill="white" opacity="0.9"/>
        <circle cx="460" cy="44" r="28" fill="#F6C026" opacity="0.9"/>
        <circle cx="460" cy="44" r="20" fill="#F8D04A"/>
        <line x1="460" y1="8" x2="460" y2="2" stroke="#F6C026" strokeWidth="3" strokeLinecap="round"/>
        <line x1="482" y1="18" x2="488" y2="12" stroke="#F6C026" strokeWidth="3" strokeLinecap="round"/>
        <line x1="496" y1="44" x2="502" y2="44" stroke="#F6C026" strokeWidth="3" strokeLinecap="round"/>
        <line x1="438" y1="18" x2="432" y2="12" stroke="#F6C026" strokeWidth="3" strokeLinecap="round"/>
        <line x1="424" y1="44" x2="418" y2="44" stroke="#F6C026" strokeWidth="3" strokeLinecap="round"/>
        {/* farmhouse */}
        <rect x="160" y="90" width="260" height="170" fill="#FFF5E8"/>
        <polygon points="148,102 290,42 432,102" fill="#C8809A"/>
        <rect x="148" y="96" width="284" height="10" fill="#B87090"/>
        <rect x="158" y="102" width="4" height="168" fill="#F0E8DC"/>
        <rect x="418" y="102" width="4" height="168" fill="#F0E8DC"/>
        <rect x="258" y="175" width="48" height="85" fill="#5BA8A0" rx="1"/>
        <rect x="266" y="196" width="10" height="10" fill="#F6C026" rx="1"/>
        <rect x="282" y="175" width="4" height="40" fill="#4A9088" rx="1"/>
        <circle cx="282" cy="170" r="12" fill="none" stroke="#8FAF8A" strokeWidth="4"/>
        <circle cx="282" cy="170" r="12" fill="none" stroke="#C8809A" strokeWidth="2" strokeDasharray="3,3"/>
        <circle cx="282" cy="162" r="3" fill="#C8809A"/>
        <rect x="176" y="124" width="68" height="68" fill="#D4EBFA" rx="2"/>
        <rect x="208" y="124" width="4" height="68" fill="#B8D4E8"/>
        <rect x="176" y="157" width="68" height="4" fill="#B8D4E8"/>
        <rect x="178" y="126" width="26" height="66" fill="#FFFFFF" opacity="0.4"/>
        <rect x="218" y="126" width="24" height="66" fill="#FFFFFF" opacity="0.4"/>
        <rect x="178" y="126" width="26" height="12" fill="#FFFFFF" opacity="0.6"/>
        <rect x="218" y="126" width="24" height="12" fill="#FFFFFF" opacity="0.6"/>
        <rect x="336" y="124" width="68" height="68" fill="#D4EBFA" rx="2"/>
        <rect x="368" y="124" width="4" height="68" fill="#B8D4E8"/>
        <rect x="336" y="157" width="68" height="4" fill="#B8D4E8"/>
        <rect x="338" y="126" width="26" height="66" fill="#FFFFFF" opacity="0.4"/>
        <rect x="378" y="126" width="24" height="66" fill="#FFFFFF" opacity="0.4"/>
        {/* picket fence */}
        <rect x="0" y="218" width="520" height="8" fill="#F0E8DC"/>
        <rect x="20" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="20" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="44" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="44" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="68" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="68" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="92" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="92" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="116" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="116" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="380" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="380" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="404" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="404" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="428" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="428" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="452" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="452" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="476" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="476" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="500" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="500" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        {/* sunflowers */}
        <rect x="30" y="160" width="6" height="60" fill="#8FAF8A"/>
        <circle cx="33" cy="155" r="14" fill="#F6C026"/><circle cx="33" cy="155" r="7" fill="#8B5E3C"/>
        <rect x="58" y="155" width="6" height="65" fill="#8FAF8A"/>
        <circle cx="61" cy="150" r="12" fill="#F8D04A"/><circle cx="61" cy="150" r="6" fill="#8B5E3C"/>
        {/* ducks */}
        <ellipse cx="360" cy="234" rx="22" ry="14" fill="#F5D060"/>
        <circle cx="378" cy="226" r="11" fill="#F5D060"/>
        <polygon points="386,224 396,228 386,232" fill="#F09020"/>
        <rect x="355" y="245" width="6" height="10" fill="#F09020" rx="2"/>
        <rect x="367" y="245" width="6" height="10" fill="#F09020" rx="2"/>
        <circle cx="381" cy="224" r="2.5" fill="#333"/>
        <ellipse cx="406" cy="242" rx="15" ry="10" fill="#F5D060"/>
        <circle cx="418" cy="236" r="8" fill="#F5D060"/>
        <polygon points="424,234 432,237 424,240" fill="#F09020"/>
        <rect x="402" y="249" width="5" height="7" fill="#F09020" rx="2"/>
        <rect x="411" y="249" width="5" height="7" fill="#F09020" rx="2"/>
        <circle cx="420" cy="235" r="2" fill="#333"/>
        <ellipse cx="440" cy="248" rx="10" ry="7" fill="#FAE08A"/>
        <circle cx="448" cy="243" r="6" fill="#FAE08A"/>
        <polygon points="452,242 458,244 452,246" fill="#F09020"/>
        <circle cx="450" cy="242" r="1.5" fill="#333"/>
        <rect x="246" y="238" width="56" height="18" fill="#C8809A" rx="2"/>
        <text x="274" y="251" fontFamily="Georgia, serif" fontSize="8" textAnchor="middle" fill="#FFFBF5">WELCOME</text>
        {/* WORKER — straw hat, blue shirt, waving, tool bag */}
        <ellipse cx="90" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="72" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="72" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="90" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M72,100 Q90,80 108,100" fill="#8B5E3C"/>
        <circle cx="84" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="96" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M85,117 Q90,122 95,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="82" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="68" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm — tool bag */}
        <rect x="44" y="140" width="26" height="10" fill="#F5C5A3" rx="4"/>
        <rect x="46" y="148" width="14" height="34" fill="#F5C5A3" rx="3"/>
        <rect x="28" y="178" width="30" height="18" fill="#8B5E3C" rx="2"/>
        <rect x="38" y="175" width="10" height="6" fill="#6B4533" rx="1"/>
        {/* right arm — waving up */}
        <rect x="112" y="132" width="14" height="12" fill="#F5C5A3" rx="4"/>
        <rect x="116" y="112" width="12" height="24" fill="#F5C5A3" rx="3"/>
        <circle cx="122" cy="108" r="9" fill="#F5C5A3"/>
        <rect x="72" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="92" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="68" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="90" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
      </svg>
    ),
  },
  {
    caption: "🪣 Specialized equipment agitates the dirt and rinses it away with purified water — leaving zero spots.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF8EE"/>
        <rect x="0" y="200" width="520" height="80" fill="#C8DEB0"/>
        <rect x="0" y="222" width="520" height="58" fill="#A8C890"/>
        <ellipse cx="440" cy="40" rx="44" ry="18" fill="white" opacity="0.9"/>
        <ellipse cx="470" cy="32" rx="28" ry="15" fill="white" opacity="0.85"/>
        {/* house */}
        <rect x="100" y="80" width="320" height="180" fill="#FFF5E8"/>
        <polygon points="88,92 260,34 432,92" fill="#C8809A"/>
        <rect x="88" y="86" width="344" height="10" fill="#B87090"/>
        {/* large window being cleaned */}
        <rect x="160" y="112" width="200" height="130" fill="#D4EBFA" rx="2"/>
        <rect x="258" y="112" width="4" height="130" fill="#B8D4E8"/>
        <rect x="160" y="175" width="200" height="4" fill="#B8D4E8"/>
        <rect x="162" y="114" width="88" height="128" fill="#FFFFFF" opacity="0.35"/>
        <rect x="270" y="114" width="88" height="128" fill="#FFFFFF" opacity="0.35"/>
        <rect x="162" y="114" width="88" height="18" fill="#FFFFFF" opacity="0.55"/>
        <rect x="270" y="114" width="88" height="18" fill="#FFFFFF" opacity="0.55"/>
        {/* flower boxes on window ledge */}
        <rect x="155" y="238" width="210" height="14" fill="#8B5E3C" rx="2"/>
        <circle cx="172" cy="234" r="6" fill="#C8809A"/><circle cx="172" cy="234" r="3" fill="#F8D04A"/><rect x="170" y="236" width="4" height="8" fill="#8FAF8A"/>
        <circle cx="192" cy="232" r="7" fill="#E8B4BC"/><circle cx="192" cy="232" r="3" fill="#FFFFFF"/><rect x="190" y="235" width="4" height="9" fill="#8FAF8A"/>
        <circle cx="212" cy="234" r="6" fill="#C8809A"/><rect x="210" y="236" width="4" height="8" fill="#8FAF8A"/>
        <circle cx="232" cy="231" r="7" fill="#F6C026"/><circle cx="232" cy="231" r="3" fill="#8B5E3C"/><rect x="230" y="235" width="4" height="9" fill="#8FAF8A"/>
        <circle cx="252" cy="234" r="6" fill="#E8B4BC"/><rect x="250" y="236" width="4" height="8" fill="#8FAF8A"/>
        <circle cx="272" cy="232" r="7" fill="#C8809A"/><rect x="270" y="235" width="4" height="9" fill="#8FAF8A"/>
        <circle cx="292" cy="234" r="6" fill="#F6C026"/><circle cx="292" cy="234" r="3" fill="#8B5E3C"/><rect x="290" y="236" width="4" height="8" fill="#8FAF8A"/>
        <circle cx="312" cy="232" r="7" fill="#E8B4BC"/><rect x="310" y="235" width="4" height="9" fill="#8FAF8A"/>
        <circle cx="332" cy="234" r="6" fill="#C8809A"/><rect x="330" y="236" width="4" height="8" fill="#8FAF8A"/>
        {/* pole and brush */}
        <rect x="100" y="28" width="6" height="198" fill="#A89888" rx="2"/>
        <rect x="92" y="22" width="22" height="8" fill="#D4A820" rx="2"/>
        <rect x="94" y="16" width="18" height="10" fill="#F6C026" rx="2"/>
        {/* water drops */}
        <ellipse cx="96" cy="40" rx="3" ry="5" fill="#60A5FA" opacity="0.6"/>
        <ellipse cx="110" cy="50" rx="2.5" ry="4" fill="#60A5FA" opacity="0.5"/>
        <ellipse cx="90" cy="58" rx="3" ry="5" fill="#7EC8E3" opacity="0.55"/>
        <ellipse cx="106" cy="66" rx="2" ry="3.5" fill="#60A5FA" opacity="0.45"/>
        <ellipse cx="94" cy="76" rx="3" ry="5" fill="#7EC8E3" opacity="0.5"/>
        <ellipse cx="112" cy="70" rx="2.5" ry="4" fill="#60A5FA" opacity="0.4"/>
        {/* duck watching */}
        <ellipse cx="448" cy="234" rx="20" ry="12" fill="#F5D060"/>
        <circle cx="464" cy="227" r="10" fill="#F5D060"/>
        <polygon points="471,225 480,228 471,231" fill="#F09020"/>
        <rect x="444" y="243" width="5" height="8" fill="#F09020" rx="2"/>
        <rect x="454" y="243" width="5" height="8" fill="#F09020" rx="2"/>
        <circle cx="466" cy="225" r="2" fill="#333"/>
        <rect x="476" y="160" width="6" height="80" fill="#8FAF8A"/>
        <circle cx="479" cy="154" r="16" fill="#F6C026"/><circle cx="479" cy="154" r="8" fill="#8B5E3C"/>
        {/* "Quack!" bubble from duck */}
        <rect x="384" y="196" width="52" height="24" fill="white" rx="8" opacity="0.9"/>
        <rect x="384" y="196" width="52" height="24" fill="none" stroke="#F5D060" strokeWidth="1.5" rx="8"/>
        <polygon points="426,220 440,220 433,232" fill="white" opacity="0.9"/>
        <text x="410" y="213" fontFamily="Georgia, serif" fontSize="10" fill="#8B5E3C" textAnchor="middle">Quack!</text>
        {/* WORKER — holding pole, right arm raised */}
        <ellipse cx="80" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="62" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="62" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="80" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M62,100 Q80,80 98,100" fill="#8B5E3C"/>
        <circle cx="74" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="86" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M75,117 Q80,122 85,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="72" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="58" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm down */}
        <rect x="34" y="140" width="26" height="10" fill="#F5C5A3" rx="4"/>
        <rect x="36" y="148" width="14" height="34" fill="#F5C5A3" rx="3"/>
        {/* right arm raised to grip pole */}
        <rect x="100" y="128" width="14" height="14" fill="#F5C5A3" rx="4"/>
        <rect x="102" y="108" width="12" height="24" fill="#F5C5A3" rx="3"/>
        <circle cx="106" cy="104" r="8" fill="#F5C5A3"/>
        <rect x="62" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="82" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="58" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="80" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
      </svg>
    ),
  },
  {
    caption: "🪟 Screen cleaning is free — and they'll remove and reinstall them for a small fee.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF8EE"/>
        <rect x="0" y="200" width="520" height="80" fill="#C8DEB0"/>
        <rect x="0" y="224" width="520" height="56" fill="#A8C890"/>
        <ellipse cx="100" cy="44" rx="44" ry="18" fill="white" opacity="0.9"/>
        <ellipse cx="130" cy="36" rx="28" ry="14" fill="white" opacity="0.85"/>
        {/* sunflowers left */}
        <rect x="18" y="158" width="5" height="82" fill="#8FAF8A"/>
        <circle cx="20" cy="152" r="14" fill="#F6C026"/><circle cx="20" cy="152" r="7" fill="#8B5E3C"/>
        <rect x="40" y="165" width="5" height="75" fill="#8FAF8A"/>
        <circle cx="42" cy="160" r="11" fill="#F8D04A"/><circle cx="42" cy="160" r="5" fill="#8B5E3C"/>
        {/* house */}
        <rect x="100" y="80" width="320" height="180" fill="#FFF5E8"/>
        <polygon points="88,92 260,36 432,92" fill="#C8809A"/>
        {/* clean window (sparkly) */}
        <rect x="180" y="108" width="160" height="120" fill="#D4EBFA" rx="2"/>
        <rect x="258" y="108" width="4" height="120" fill="#B8D4E8"/>
        <rect x="180" y="167" width="160" height="4" fill="#B8D4E8"/>
        <text x="178" y="106" fontSize="12" fill="#F6C026">✦</text>
        <text x="342" y="106" fontSize="12" fill="#F6C026">✦</text>
        <text x="180" y="236" fontSize="9" fill="#F6C026">✦</text>
        <text x="340" y="236" fontSize="9" fill="#F6C026">✦</text>
        {/* picket fence */}
        <rect x="0" y="218" width="520" height="8" fill="#F0E8DC"/>
        <rect x="60" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="60" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="84" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="84" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="380" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="380" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="404" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="404" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="428" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="428" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        <rect x="452" y="205" width="8" height="22" fill="#F0E8DC" rx="2"/><rect x="452" y="202" width="8" height="8" fill="#F0E8DC" rx="4"/>
        {/* duck family watching */}
        <ellipse cx="450" cy="236" rx="18" ry="11" fill="#F5D060"/>
        <circle cx="464" cy="229" r="9" fill="#F5D060"/>
        <polygon points="470,227 478,230 470,233" fill="#F09020"/>
        <circle cx="466" cy="227" r="2" fill="#333"/>
        <rect x="447" y="244" width="5" height="7" fill="#F09020" rx="2"/>
        <rect x="456" y="244" width="5" height="7" fill="#F09020" rx="2"/>
        <ellipse cx="480" cy="244" rx="12" ry="8" fill="#FAE08A"/>
        <circle cx="489" cy="239" r="6" fill="#FAE08A"/>
        <polygon points="494,238 500,240 494,242" fill="#F09020"/>
        <circle cx="491" cy="238" r="1.5" fill="#333"/>
        {/* screen leaning against left wall */}
        <rect x="108" y="110" width="56" height="110" fill="#64748B" rx="3"/>
        <rect x="112" y="114" width="48" height="102" fill="#94A3B8" rx="2" opacity="0.6"/>
        <line x1="122" y1="114" x2="122" y2="216" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        <line x1="136" y1="114" x2="136" y2="216" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        <line x1="150" y1="114" x2="150" y2="216" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        <line x1="112" y1="140" x2="160" y2="140" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        <line x1="112" y1="166" x2="160" y2="166" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        <line x1="112" y1="192" x2="160" y2="192" stroke="#7B8FA1" strokeWidth="1" opacity="0.5"/>
        {/* "FREE" speech bubble */}
        <rect x="90" y="60" width="72" height="26" fill="#FFEEAA" rx="4"/>
        <rect x="88" y="58" width="76" height="30" fill="none" stroke="#F6C026" strokeWidth="1.5" rx="4"/>
        <polygon points="118,88 134,88 126,102" fill="#FFEEAA"/>
        <text x="126" y="79" fontFamily="Georgia, serif" fontSize="11" textAnchor="middle" fontWeight="bold" fill="#8B5E3C">FREE!</text>
        {/* WORKER — standing next to screen, right arm gesturing at window */}
        <ellipse cx="260" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="242" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="242" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="260" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M242,100 Q260,80 278,100" fill="#8B5E3C"/>
        <circle cx="254" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="266" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M255,117 Q260,122 265,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="252" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="238" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm gesturing toward screen */}
        <rect x="196" y="140" width="44" height="10" fill="#F5C5A3" rx="4"/>
        <circle cx="193" cy="144" r="8" fill="#F5C5A3"/>
        {/* right arm pointing at window */}
        <rect x="282" y="132" width="14" height="12" fill="#F5C5A3" rx="4"/>
        <rect x="288" y="114" width="10" height="22" fill="#F5C5A3" rx="3"/>
        <circle cx="293" cy="110" r="8" fill="#F5C5A3"/>
        <rect x="242" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="262" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="238" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="260" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
      </svg>
    ),
  },
  {
    caption: "💧 He'll wait for you to see that the water droplets dry completely spot-free before leaving.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF5E8"/>
        <rect x="0" y="198" width="520" height="82" fill="#C8DEB0"/>
        <rect x="0" y="222" width="520" height="58" fill="#A8C890"/>
        <ellipse cx="350" cy="46" rx="52" ry="20" fill="white" opacity="0.9"/>
        <ellipse cx="388" cy="36" rx="32" ry="16" fill="white" opacity="0.85"/>
        {/* porch columns */}
        <rect x="156" y="70" width="8" height="190" fill="#F0E8DC"/>
        <rect x="356" y="70" width="8" height="190" fill="#F0E8DC"/>
        <rect x="118" y="60" width="284" height="200" fill="#FFF5E8"/>
        <rect x="110" y="60" width="300" height="14" fill="#B87090"/>
        {/* clean window */}
        <rect x="182" y="100" width="156" height="122" fill="#D4EBFA" rx="2"/>
        <rect x="258" y="100" width="4" height="122" fill="#B8D4E8"/>
        <rect x="182" y="160" width="156" height="4" fill="#B8D4E8"/>
        <rect x="184" y="102" width="66" height="120" fill="white" opacity="0.3"/>
        <rect x="270" y="102" width="66" height="120" fill="white" opacity="0.3"/>
        <rect x="184" y="102" width="66" height="14" fill="white" opacity="0.5"/>
        <rect x="270" y="102" width="66" height="14" fill="white" opacity="0.5"/>
        {/* drying droplets */}
        <ellipse cx="200" cy="128" rx="3" ry="5" fill="#7EC8E3" opacity="0.35"/>
        <ellipse cx="218" cy="142" rx="2.5" ry="4" fill="#7EC8E3" opacity="0.3"/>
        <ellipse cx="284" cy="120" rx="3" ry="5" fill="#7EC8E3" opacity="0.35"/>
        <rect x="186" y="106" width="44" height="8" fill="white" rx="2" opacity="0.6"/>
        <rect x="272" y="108" width="38" height="6" fill="white" rx="2" opacity="0.5"/>
        {/* flower box */}
        <rect x="177" y="220" width="166" height="12" fill="#8B5E3C" rx="2"/>
        <circle cx="194" cy="217" r="6" fill="#C8809A"/><circle cx="194" cy="217" r="3" fill="#F8D04A"/>
        <circle cx="214" cy="215" r="7" fill="#E8B4BC"/>
        <circle cx="234" cy="217" r="6" fill="#F6C026"/><circle cx="234" cy="217" r="3" fill="#8B5E3C"/>
        <circle cx="254" cy="215" r="7" fill="#C8809A"/>
        <circle cx="274" cy="217" r="6" fill="#E8B4BC"/>
        <circle cx="294" cy="215" r="7" fill="#F6C026"/><circle cx="294" cy="215" r="3" fill="#8B5E3C"/>
        <circle cx="314" cy="217" r="6" fill="#C8809A"/>
        <circle cx="334" cy="215" r="7" fill="#E8B4BC"/>
        {/* WORKER (left) pointing at window */}
        <ellipse cx="90" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="72" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="72" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="90" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M72,100 Q90,80 108,100" fill="#8B5E3C"/>
        <circle cx="84" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="96" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M85,117 Q90,122 95,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="82" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="68" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm down */}
        <rect x="44" y="140" width="26" height="10" fill="#F5C5A3" rx="4"/>
        <rect x="46" y="148" width="14" height="34" fill="#F5C5A3" rx="3"/>
        {/* right arm pointing at window */}
        <rect x="112" y="136" width="46" height="10" fill="#F5C5A3" rx="4"/>
        <circle cx="161" cy="140" r="8" fill="#F5C5A3"/>
        <rect x="72" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="92" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="68" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="90" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        {/* CUSTOMER (right) */}
        <circle cx="424" cy="150" r="20" fill="#FDDBB4"/>
        <rect x="406" y="170" width="36" height="44" fill="#8FAF8A" rx="3"/>
        <rect x="384" y="174" width="22" height="10" fill="#FDDBB4" rx="4"/>
        <rect x="442" y="174" width="22" height="10" fill="#FDDBB4" rx="4"/>
        <rect x="408" y="214" width="14" height="36" fill="#5C3D1E" rx="3"/>
        <rect x="426" y="214" width="14" height="36" fill="#5C3D1E" rx="3"/>
        <rect x="406" y="246" width="18" height="8" fill="#4A3A2A" rx="2"/>
        <rect x="424" y="246" width="18" height="8" fill="#4A3A2A" rx="2"/>
        <path d="M404,138 Q424,118 444,138" fill="#8B5E3C"/>
        <path d="M416,162 Q424,170 432,162" stroke="#8B5E3C" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* speech bubble */}
        <rect x="372" y="90" width="100" height="40" fill="white" rx="10" opacity="0.95"/>
        <rect x="372" y="90" width="100" height="40" fill="none" stroke="#E8D5BC" strokeWidth="1.5" rx="10"/>
        <polygon points="414,130 430,130 422,144" fill="white" opacity="0.95"/>
        <text x="422" y="107" fontFamily="Georgia, serif" fontSize="9" textAnchor="middle" fill="#5C3D1E" fontStyle="italic">Beautiful!</text>
        <text x="422" y="122" fontFamily="Georgia, serif" fontSize="9" textAnchor="middle" fill="#5C3D1E" fontStyle="italic">Spot free! ✨</text>
        {/* duck */}
        <ellipse cx="290" cy="256" rx="16" ry="10" fill="#F5D060"/>
        <circle cx="302" cy="250" r="8" fill="#F5D060"/>
        <polygon points="307,249 314,251 307,253" fill="#F09020"/>
        <circle cx="304" cy="248" r="2" fill="#333"/>
      </svg>
    ),
  },
  {
    caption: "📋 Need a full estimate? Your worker will gladly provide one — completely free.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF8EE"/>
        <rect x="0" y="200" width="520" height="80" fill="#C8DEB0"/>
        <rect x="0" y="222" width="520" height="58" fill="#A8C890"/>
        <ellipse cx="80" cy="42" rx="44" ry="18" fill="white" opacity="0.9"/>
        {/* porch house */}
        <rect x="80" y="78" width="360" height="182" fill="#FFF5E8"/>
        <polygon points="68,90 260,36 452,90" fill="#C8809A"/>
        <rect x="68" y="84" width="384" height="10" fill="#B87090"/>
        <rect x="80" y="212" width="360" height="32" fill="#F0E8DC"/>
        <rect x="98" y="88" width="6" height="124" fill="#F0E8DC"/>
        <rect x="416" y="88" width="6" height="124" fill="#F0E8DC"/>
        <rect x="80" y="210" width="360" height="6" fill="#F0E8DC"/>
        <rect x="100" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="116" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="132" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="148" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="380" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="396" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="412" y="210" width="4" height="32" fill="#E8DCD0"/>
        <rect x="226" y="152" width="48" height="94" fill="#5BA8A0" rx="1"/>
        <rect x="246" y="170" width="10" height="10" fill="#F6C026" rx="1"/>
        <rect x="222" y="148" width="56" height="6" fill="#D4B840"/>
        <rect x="116" y="110" width="70" height="70" fill="#D4EBFA" rx="2"/>
        <rect x="149" y="110" width="4" height="70" fill="#B8D4E8"/>
        <rect x="116" y="144" width="70" height="4" fill="#B8D4E8"/>
        <rect x="334" y="110" width="70" height="70" fill="#D4EBFA" rx="2"/>
        <rect x="367" y="110" width="4" height="70" fill="#B8D4E8"/>
        <rect x="334" y="144" width="70" height="4" fill="#B8D4E8"/>
        {/* sunflowers */}
        <rect x="30" y="162" width="5" height="78" fill="#8FAF8A"/>
        <circle cx="32" cy="156" r="14" fill="#F6C026"/><circle cx="32" cy="156" r="7" fill="#8B5E3C"/>
        <rect x="52" y="170" width="5" height="70" fill="#8FAF8A"/>
        <circle cx="54" cy="165" r="11" fill="#F8D04A"/><circle cx="54" cy="165" r="5" fill="#8B5E3C"/>
        {/* duck */}
        <ellipse cx="478" cy="240" rx="18" ry="11" fill="#F5D060"/>
        <circle cx="492" cy="233" r="9" fill="#F5D060"/>
        <polygon points="498,231 506,234 498,237" fill="#F09020"/>
        <circle cx="494" cy="231" r="2" fill="#333"/>
        <rect x="474" y="248" width="5" height="7" fill="#F09020" rx="2"/>
        <rect x="484" y="248" width="5" height="7" fill="#F09020" rx="2"/>
        {/* CLIPBOARD */}
        <rect x="178" y="106" width="84" height="110" fill="#FFFBF5" rx="3"/>
        <rect x="176" y="104" width="88" height="114" fill="none" stroke="#C8A87A" strokeWidth="1.5" rx="3"/>
        <rect x="206" y="98" width="28" height="16" fill="#C8A87A" rx="3"/>
        <rect x="210" y="100" width="20" height="10" fill="#D4B840" rx="2"/>
        <rect x="182" y="120" width="76" height="2" fill="#C8809A"/>
        <text x="220" y="138" fontFamily="Georgia, serif" fontSize="9" fill="#5C3D1E" textAnchor="middle" fontStyle="italic">12 windows</text>
        <text x="248" y="138" fontFamily="Georgia, serif" fontSize="9" fill="#5C3D1E" textAnchor="end">$120</text>
        <rect x="182" y="142" width="76" height="1" fill="#E8D5BC"/>
        <text x="220" y="158" fontFamily="Georgia, serif" fontSize="9" fill="#5C3D1E" textAnchor="middle" fontStyle="italic">Screens</text>
        <text x="248" y="158" fontFamily="Georgia, serif" fontSize="9" fill="#8FAF8A" fontWeight="bold" textAnchor="end">FREE</text>
        <rect x="182" y="162" width="76" height="1" fill="#E8D5BC"/>
        <text x="220" y="178" fontFamily="Georgia, serif" fontSize="9" fill="#5C3D1E" textAnchor="middle" fontStyle="italic">Promo</text>
        <text x="248" y="178" fontFamily="Georgia, serif" fontSize="9" fill="#DC2626" textAnchor="end">-$60</text>
        <rect x="182" y="184" width="76" height="2" fill="#C8809A"/>
        <text x="220" y="202" fontFamily="Georgia, serif" fontSize="11" fill="#5C3D1E" textAnchor="middle" fontWeight="bold">Total: $60</text>
        {/* WORKER on porch (right) with clipboard */}
        <ellipse cx="365" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="347" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="347" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="365" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M347,100 Q365,80 383,100" fill="#8B5E3C"/>
        <circle cx="359" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="371" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M360,117 Q365,122 370,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="357" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="343" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm extended holding clipboard */}
        <rect x="304" y="140" width="41" height="10" fill="#F5C5A3" rx="4"/>
        <circle cx="302" cy="144" r="8" fill="#F5C5A3"/>
        {/* right arm down */}
        <rect x="387" y="140" width="26" height="10" fill="#F5C5A3" rx="4"/>
        <rect x="400" y="148" width="14" height="34" fill="#F5C5A3" rx="3"/>
        <rect x="347" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="367" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="343" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="365" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
      </svg>
    ),
  },
  {
    caption: "📱 Your worker signs out digitally — and you'll receive a review form plus a discount on your next visit.",
    svg: (
      <svg viewBox="0 0 520 280" xmlns="http://www.w3.org/2000/svg" style={SVG_STYLE}>
        <rect width="520" height="280" fill="#FFF3E0"/>
        <rect x="0" y="190" width="520" height="90" fill="#C8DEB0"/>
        <rect x="0" y="218" width="520" height="62" fill="#9ABA8A"/>
        <ellipse cx="470" cy="60" rx="60" ry="60" fill="#F59E0B" opacity="0.12"/>
        {/* house golden hour */}
        <rect x="100" y="70" width="240" height="190" fill="#FFF0DC"/>
        <polygon points="88,82 220,28 352,82" fill="#C8809A"/>
        <rect x="88" y="76" width="264" height="10" fill="#B87090"/>
        <rect x="122" y="106" width="70" height="64" fill="#FEF3C7" opacity="0.95" rx="2"/>
        <rect x="155" y="106" width="4" height="64" fill="#FCD34D" opacity="0.5"/>
        <rect x="122" y="137" width="70" height="4" fill="#FCD34D" opacity="0.5"/>
        <rect x="124" y="108" width="28" height="62" fill="white" opacity="0.35"/>
        <rect x="162" y="108" width="28" height="62" fill="white" opacity="0.35"/>
        <rect x="218" y="106" width="70" height="64" fill="#FEF3C7" opacity="0.9" rx="2"/>
        <rect x="251" y="106" width="4" height="64" fill="#FCD34D" opacity="0.4"/>
        <rect x="166" y="188" width="48" height="82" fill="#5BA8A0" rx="1"/>
        <rect x="186" y="208" width="10" height="10" fill="#FCD34D" rx="1"/>
        <circle cx="340" cy="80" r="10" fill="#FEF3C7" opacity="0.8"/>
        <circle cx="340" cy="80" r="5" fill="#F59E0B"/>
        {/* picket fence */}
        <rect x="0" y="218" width="520" height="6" fill="#F0E8DC"/>
        <rect x="22" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="22" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="40" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="40" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="58" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="58" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="380" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="380" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="400" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="400" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="420" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="420" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="440" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="440" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="460" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="460" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="480" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="480" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        <rect x="500" y="206" width="6" height="18" fill="#F0E8DC" rx="2"/><rect x="500" y="203" width="6" height="7" fill="#F0E8DC" rx="3"/>
        {/* duck family */}
        <ellipse cx="290" cy="250" rx="16" ry="10" fill="#F5D060"/>
        <circle cx="302" cy="244" r="8" fill="#F5D060"/>
        <polygon points="307,242 314,245 307,248" fill="#F09020"/>
        <circle cx="304" cy="242" r="2" fill="#333"/>
        <rect x="287" y="257" width="4" height="6" fill="#F09020" rx="1"/>
        <rect x="295" y="257" width="4" height="6" fill="#F09020" rx="1"/>
        <ellipse cx="322" cy="256" rx="12" ry="8" fill="#FAE08A"/>
        <circle cx="331" cy="251" r="6" fill="#FAE08A"/>
        <polygon points="336,250 342,252 336,254" fill="#F09020"/>
        <circle cx="333" cy="249" r="1.5" fill="#333"/>
        <rect x="319" y="262" width="3" height="5" fill="#F09020" rx="1"/>
        <rect x="325" y="262" width="3" height="5" fill="#F09020" rx="1"/>
        {/* review card */}
        <rect x="100" y="30" width="220" height="70" fill="white" rx="10"/>
        <rect x="100" y="30" width="220" height="70" fill="none" stroke="#E8D5BC" strokeWidth="1.5" rx="10"/>
        <polygon points="196,100 216,100 206,114" fill="white"/>
        <rect x="110" y="40" width="40" height="40" fill="#FFF0DC" rx="6"/>
        <text x="130" y="68" fontSize="22" textAnchor="middle">🌟</text>
        <text x="168" y="54" fontFamily="Georgia, serif" fontSize="10" fill="#5C3D1E" fontWeight="bold">Your review request</text>
        <text x="168" y="68" fontFamily="Georgia, serif" fontSize="9" fill="#8B5E3C" fontStyle="italic">+ 10% off your next visit</text>
        <rect x="162" y="75" width="80" height="16" fill="#C8809A" rx="5"/>
        <text x="202" y="87" fontFamily="Georgia, serif" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">Leave a Review</text>
        {/* WORKER — waving + phone */}
        <ellipse cx="406" cy="88" rx="34" ry="7" fill="#C8A832"/>
        <rect x="388" y="62" width="36" height="30" fill="#D4B840" rx="3"/>
        <rect x="388" y="82" width="36" height="6" fill="#C8809A"/>
        <circle cx="406" cy="106" r="18" fill="#F5C5A3"/>
        <path d="M388,100 Q406,80 424,100" fill="#8B5E3C"/>
        <circle cx="400" cy="108" r="2.5" fill="#8B6040"/>
        <circle cx="412" cy="108" r="2.5" fill="#8B6040"/>
        <path d="M401,117 Q406,122 411,117" stroke="#8B6040" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="398" y="124" width="16" height="12" fill="#F5C5A3"/>
        <rect x="384" y="136" width="44" height="58" fill="#4A90D9" rx="3"/>
        {/* left arm waving */}
        <rect x="360" y="132" width="26" height="10" fill="#F5C5A3" rx="4"/>
        <rect x="352" y="112" width="12" height="24" fill="#F5C5A3" rx="3"/>
        <circle cx="357" cy="108" r="9" fill="#F5C5A3"/>
        {/* right arm holding phone */}
        <rect x="428" y="128" width="16" height="14" fill="#F5C5A3" rx="4"/>
        <rect x="432" y="108" width="12" height="24" fill="#F5C5A3" rx="3"/>
        <rect x="428" y="70" width="24" height="42" fill="#2D3748" rx="4"/>
        <rect x="430" y="72" width="20" height="38" fill="#1A2332" rx="3"/>
        <text x="440" y="84" fontFamily="Georgia, serif" fontSize="7" fill="#F59E0B" textAnchor="middle">★★★★★</text>
        <rect x="434" y="88" width="12" height="2" fill="#374151" rx="1"/>
        <rect x="434" y="92" width="10" height="2" fill="#374151" rx="1"/>
        <rect x="434" y="96" width="6" height="6" fill="#10B981" rx="1"/>
        <rect x="442" y="96" width="6" height="6" fill="#10B981" rx="1"/>
        <rect x="388" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="408" y="194" width="14" height="50" fill="#1E3A5F" rx="3"/>
        <rect x="384" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
        <rect x="406" y="240" width="20" height="10" fill="#2D2D2D" rx="2"/>
      </svg>
    ),
  },
];

export default function SlideshowHtml({ onClose }: { onClose?: () => void }) {
  const [current, setCurrent]   = useState(0);
  const [progress, setProgress] = useState(0);
  const [fast, setFast]         = useState(false);

  const startRef   = useRef<number>(0);
  const rafRef     = useRef<number>(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fastRef    = useRef(false);
  const currentRef = useRef(0);

  const goTo = useCallback((n: number) => {
    const next = ((n % SLIDES.length) + SLIDES.length) % SLIDES.length;
    currentRef.current = next;
    setCurrent(next);
    setFast(false);
    fastRef.current = false;
    setProgress(0);
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();

    const tick = () => {
      const dur = fastRef.current ? FAST_DURATION : DURATION;
      const elapsed = performance.now() - startRef.current;
      const pct = Math.min((elapsed / dur) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    const schedule = () => {
      const dur = fastRef.current ? FAST_DURATION : DURATION;
      const elapsed = performance.now() - startRef.current;
      const remaining = Math.max(0, dur - elapsed);
      timerRef.current = setTimeout(() => {
        goTo(currentRef.current + 1);
      }, remaining);
    };
    schedule();
  }, [goTo]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, [current, startTimer]);

  function handleNext() {
    if (!fastRef.current) {
      fastRef.current = true;
      setFast(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      startRef.current = performance.now() - (DURATION - FAST_DURATION);
      timerRef.current = setTimeout(() => {
        goTo(currentRef.current + 1);
      }, FAST_DURATION);
    } else {
      goTo(currentRef.current + 1);
    }
  }

  function handlePrev() {
    goTo(currentRef.current - 1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: "100%" }}
    >
      <div style={{
        background: "#FFFBF5",
        borderRadius: 8,
        overflow: "hidden",
        border: "1.5px solid #C8A87A",
        boxShadow: "0 8px 40px rgba(139,94,60,0.18), 0 2px 8px rgba(0,0,0,0.1)",
        position: "relative",
      }}>
        {/* Wallpaper border — top */}
        <div style={{ height: 18, background: WALLPAPER_TOP }} />

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 26, right: 8, zIndex: 2,
              background: "rgba(139,94,60,0.15)", border: "none", borderRadius: "50%",
              width: 22, height: 22, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#8B5E3C", lineHeight: 1,
            }}
          >✕</button>
        )}

        {/* SVG scene */}
        <div style={{ padding: "8px 8px 0" }}>
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            {SLIDES[current].svg}
          </motion.div>
        </div>

        {/* Caption */}
        <div style={{ padding: "10px 14px 6px" }}>
          <motion.p
            key={`cap-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            style={{
              fontSize: 13, lineHeight: 1.55, color: "#5C3D1E",
              margin: 0, textAlign: "center",
              fontFamily: "Georgia, serif", fontStyle: "italic",
            }}
          >
            {SLIDES[current].caption}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div style={{ margin: "8px 14px 0", height: 3, background: "#EBD9C4", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%", background: "#C8809A", borderRadius: 2,
            width: `${progress}%`, transition: fast ? "none" : undefined,
          }} />
        </div>

        {/* Dots — nav buttons removed; auto-advance carries the show */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px 10px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: 7, height: 7, borderRadius: "50%", border: "none", padding: 0, cursor: "pointer",
                  background: i === current ? "#C8809A" : "#DEC8AA",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Wallpaper border — bottom */}
        <div style={{ height: 18, background: WALLPAPER_BTM }} />
      </div>
    </motion.div>
  );
}
