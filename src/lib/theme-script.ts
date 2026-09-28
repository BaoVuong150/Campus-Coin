/**
 * Hằng dùng chung giữa Server Component (layout) và ThemeContext.
 * Đặt ở module thường (không "use client") để server nhận được giá trị thật thay vì client reference.
 */
export const THEME_STORAGE_KEY = "campuscoin_theme";
export const FONT_SIZE_STORAGE_KEY = "campuscoin_font_size";

/** Chạy trước khi hydrate: đọc lựa chọn đã lưu, mặc định theo hệ điều hành, để trang không bị nháy màu. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.setAttribute("data-theme",t);var f=localStorage.getItem("${FONT_SIZE_STORAGE_KEY}");r.setAttribute("data-font-size",f==="large"||f==="larger"?f:"normal")}catch(e){}})();`;
