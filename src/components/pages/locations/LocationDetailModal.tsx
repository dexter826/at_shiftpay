import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  MessageSquare,
  Calendar,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import { Modal } from "../../ui/Modal";
import Button from "../../ui/Button";
import { Location, Event } from "../../../types";
import { useThemeStyles } from "../../../hooks/useThemeStyles";
import PenIcon from "../../ui/icons/pen-icon";
import { AnimatedIconHandle } from "../../ui/icons/types";

const LOCATIONIQ_API_KEY =
  import.meta.env.VITE_LOCATIONIQ_API_KEY || "free_key_placeholder";

interface LocationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: Location | null;
  events: Event[];
  onEditClick: (loc: Location) => void;
}

const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  isOpen,
  onClose,
  location,
  events,
  onEditClick,
}) => {
  const {
    theme,
    borderClass,
    cardBgClass,
    textPrimaryClass,
    textSecondaryClass,
    textMutedClass,
    hoverBgClass,
  } = useThemeStyles();

  const editIconRef = React.useRef<AnimatedIconHandle>(null);

  if (!location) return null;

  const hasCoords = location.latitude && location.longitude;
  const mapUrl = hasCoords
    ? `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=${location.latitude},${location.longitude}&zoom=17&size=600x400&markers=icon:large-blue-cutout|${location.latitude},${location.longitude}`
    : `https://maps.locationiq.com/v3/staticmap?key=${LOCATIONIQ_API_KEY}&center=21.02776,105.83416&zoom=12&size=600x400`;

  // Lọc sự kiện của địa điểm này và sắp xếp mới nhất
  const locationEvents = events
    .filter((e) => e.locationId === location.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenInGoogleMaps = () => {
    const { latitude, longitude, address } = location;
    let url = "";
    if (latitude && longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    } else if (address && address.trim()) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
    }
    if (url) window.open(url, "_blank");
  };

  const renderReviewBadge = () => {
    if (location.review === "high") {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
          <ThumbsUp size={14} />
          <span>Tốt</span>
        </div>
      );
    }
    if (location.review === "low") {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
          <ThumbsDown size={14} />
          <span>Kém</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-500 text-xs font-bold border border-slate-500/20">
        <Minus size={14} />
        <span>Thường</span>
      </div>
    );
  };

  return (
    <Modal
      title="Chi tiết địa điểm"
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            onEditClick(location);
          }}
          onMouseEnter={() => editIconRef.current?.startAnimation()}
          onMouseLeave={() => editIconRef.current?.stopAnimation()}
          fullWidth
          className="flex justify-center items-center gap-2"
        >
          <PenIcon ref={editIconRef} size={18} color="currentColor" />
          Chỉnh sửa địa điểm
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <h3
              className={`text-2xl font-black tracking-tight ${textPrimaryClass} leading-tight`}
            >
              {location.name}
            </h3>
            {renderReviewBadge()}
          </div>

          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border shadow-inner">
            <img
              src={mapUrl}
              alt={location.name}
              className={`w-full h-full object-cover ${!hasCoords ? "blur-[2px] opacity-60" : ""}`}
            />
            {!hasCoords && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/20">
                <span
                  className={`${cardBgClass} bg-opacity-90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold ${textPrimaryClass} shadow-sm border ${borderClass}`}
                >
                  Chưa có tọa độ chính xác
                </span>
              </div>
            )}
            <button
              onClick={handleOpenInGoogleMaps}
              className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border border-white/20 hover:scale-105 transition-transform active:scale-95"
              title="Mở trong Google Maps"
            >
              <ExternalLink size={20} className="text-blue-500" />
            </button>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <MapPin size={20} className="text-primary shrink-0 mt-0.5" />
            <span className={`text-sm leading-relaxed ${textSecondaryClass}`}>
              {location.address || "Địa chỉ chưa xác định"}
            </span>
          </div>

          {location.reviewNote && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 italic">
              <MessageSquare
                size={18}
                className="text-amber-500 shrink-0 mt-1"
              />
              <p className={`text-sm ${textSecondaryClass} leading-relaxed`}>
                "{location.reviewNote}"
              </p>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
            <h4
              className={`text-[10px] font-black uppercase tracking-[0.2em] ${textMutedClass}`}
            >
              Lịch sử công việc
            </h4>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {locationEvents.length > 0 ? (
              locationEvents.map((event, idx) => {
                const eventDate = new Date(event.date).toLocaleDateString(
                  "vi-VN",
                  {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  },
                );
                return (
                  <div
                    key={event.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${hoverBgClass} ${borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div
                          className={`text-sm font-bold ${textPrimaryClass}`}
                        >
                          {event.title}
                        </div>
                        <div className={`text-[11px] ${textSecondaryClass}`}>
                          {eventDate}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-black ${textPrimaryClass}`}>
                        {event.amount?.toLocaleString("vi-VN")}đ
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 opacity-40">
                <Calendar size={32} className="mx-auto mb-2" />
                <p className="text-xs font-medium">
                  Chưa có lịch sử làm việc tại đây
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default memo(LocationDetailModal);
