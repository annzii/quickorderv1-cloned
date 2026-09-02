import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BottomNav from '@/components/BottomNav';
import { Image } from '@/components/ui/image';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { Instagram, Facebook, Star, MessageSquare, Home } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';

export default function ThankYou() {
  const [settings, setSettings] = useState(null);
  const { lang, t } = useLanguage();

  useEffect(() => {
    base44.entities.StoreSettings.list().then((s) => setSettings(s[0] || null));
  }, []);

  const wa = settings?.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}` : null;

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <header className="bg-background border-b border-border">
        <div className="max-w-md mx-auto px-5 pt-7 pb-5 text-center">
          <p className="category-filter mb-2 text-[hsl(var(--primary))]">{t(settings?.thankyou_header_label, settings?.thankyou_header_label_th) || (lang === 'th' ? 'ส่งคำสั่งซื้อแล้ว' : 'Order Sent')}</p>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-5 py-8 flex-1 flex flex-col">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <WhatsAppIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="font-display text-2xl text-foreground leading-snug mb-3">{t(settings?.thankyou_title_label, settings?.thankyou_title_label_th) || (lang === 'th' ? 'ขอบคุณสำหรับคำสั่งซื้อ!' : 'Thank you for your order!')}</p>
          <p className="text-[12px] text-[#7d7a76] leading-relaxed max-w-xs">
            {t(settings?.thankyou_subtitle_label, settings?.thankyou_subtitle_label_th) || (lang === 'th' ? 'พนักงานของเราจะติดต่อกลับเพื่อยืนยันภายในไม่กี่นาที กรุณาเฝ้าดู WhatsApp ของคุณ' : 'Our staff will get back to you with a confirmation in a few minutes. Please keep an eye on your WhatsApp.')}
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          {settings?.logo_url &&
          <div className="mb-4 flex justify-center">
              <Image src={settings.logo_url} fittingType="fit" className="max-w-full h-auto max-h-20 object-contain px-10" />
            </div>
          }
          <h2 className="category-filter text-muted-foreground mb-4 text-center">{t(settings?.thankyou_connect_label, settings?.thankyou_connect_label_th) || (lang === 'th' ? 'ติดตามเรา' : 'Stay Connected')}</h2>
          <div className="flex items-center justify-center gap-3">
            {wa &&
            <a href={wa} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            }
            {settings?.instagram_url &&
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            }
            {settings?.facebook_url &&
            <a href={settings.facebook_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
            }
            {settings?.google_review_url &&
            <a href={settings.google_review_url} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                <Star className="w-4 h-4" />
              </a>
            }
          </div>
        </div>

        {settings?.google_review_url &&
        <a
          href={settings.google_review_url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 w-full py-3 rounded-full border border-primary text-primary text-xs font-medium font-body flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors">
          
            <Star className="w-4 h-4" /> {t(settings?.thankyou_review_label, settings?.thankyou_review_label_th) || (lang === 'th' ? 'รีวิวเราบน Google' : 'Review us on Google')}
          </a>
        }
        <p className="mt-3 text-[11px] text-[#7d7a76] leading-relaxed text-center">
          {(t(settings?.thankyou_review_note, settings?.thankyou_review_note_th) || (lang === 'th' ? 'ทุกคะแนนช่วยให้ลูกค้ามากขึ้นเจอเรา\nขอบคุณที่สนับสนุนร้านเล็กๆ ของเรา ❤️' : 'Every rating helps more pizza lovers find us.\nThank you for supporting our little local pizzeria. ❤️')).split('\n').map((line, i, arr) => (
            <React.Fragment key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>

        <div className="mt-6 p-4 bg-[#fdfcf8] border border-border rounded-2xl">
          <p className="text-[12px] text-[#7d7a76] leading-relaxed flex items-start gap-2">
            <MessageSquare className="w-4 h-4 shrink-0 text-primary mt-0.5" />
            <span>{t(settings?.thankyou_suggestion, settings?.thankyou_suggestion_th) || (lang === 'th' ? "มีข้อเสนอแนะ? เราอยากฟังว่าเราจะทำให้ดีขึ้นได้อย่างไร ส่งข้อความถึงเราได้ทาง WhatsApp" : "Have a suggestion? We'd love to hear how we can do better. Drop us a message on WhatsApp.")}</span>
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 text-primary text-xs font-medium font-body hover:opacity-70 transition-opacity">
          
          <Home className="w-4 h-4" /> {t(settings?.thankyou_back_label, settings?.thankyou_back_label_th) || (lang === 'th' ? 'กลับเมนู' : 'Back to Menu')}
        </Link>
      </main>

      <BottomNav />
    </div>);

}