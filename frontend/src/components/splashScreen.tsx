import { motion, AnimatePresence } from "framer-motion";

// Color Token Constants
export const QUICKKART_GREEN = "#145C43";
export const QUICKKART_LIME = "#A9CC3B";
export const QUICKKART_TEXT = "#1F231F";
export const QUICKKART_BORDER = "#E4E7DE";
export const QUICKKART_WHITE = "#FFFFFF";

export interface SplashScreenProps {
  isLoading: boolean;
}

export function SplashScreen({ isLoading }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="quickkart-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
        >
          <div className="flex flex-col items-center justify-center text-center">
            {/* 64px Rounded Icon Tile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.45,
                ease: "easeOut",
              }}
              className="flex h-16 w-16 items-center justify-center rounded-[16px] border border-[#E4E7DE] bg-white shadow-sm"
            >
              {/* Minimal Cart SVG with Path Drawing Animation */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Cart Body Outline Path */}
                <motion.path
                  d="M3 3H5.25L7.2 14.25C7.3 14.85 7.8 15.3 8.4 15.3H18.6C19.2 15.3 19.7 14.85 19.8 14.25L21 7.5H6"
                  stroke={QUICKKART_GREEN}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.45,
                    ease: [0.65, 0, 0.35, 1],
                  }}
                />
                {/* Left Solid Wheel Dot */}
                <motion.circle
                  cx="8.5"
                  cy="18.5"
                  r="1.25"
                  fill={QUICKKART_GREEN}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.15, ease: "linear" }}
                />
                {/* Right Solid Wheel Dot */}
                <motion.circle
                  cx="17.5"
                  cy="18.5"
                  r="1.25"
                  fill={QUICKKART_GREEN}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.15, ease: "linear" }}
                />
              </svg>
            </motion.div>

            {/* Wordmark: Quick (#1F231F) + Kart (#145C43) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.65,
                duration: 0.5,
                ease: "easeOut",
              }}
              className="mt-4 flex items-center text-[19px] font-medium tracking-wide select-none"
              style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
            >
              <span style={{ color: QUICKKART_TEXT }}>Quick</span>
              <span style={{ color: QUICKKART_GREEN }}>Kart</span>
            </motion.div>

            {/* 3 Staggered Citrus-Lime Green Pulse Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.2, ease: "easeOut" }}
              className="mt-4 flex items-center justify-center gap-1.5"
            >
              {[0, 1, 2].map((index) => (
                <motion.span
                  key={index}
                  className="h-[5px] w-[5px] rounded-full"
                  style={{ backgroundColor: QUICKKART_LIME }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "linear",
                    delay: 1.0 + index * 0.22,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SplashScreen;
