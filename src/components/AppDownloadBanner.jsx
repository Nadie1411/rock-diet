const AppDownloadBanner = () => {
  return (
    <div className="w-full bg-primary text-white px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-left">


          <div>
            <p className="font-semibold text-sm sm:text-base">
              Get our mobile app 
            </p>
            <p className="text-xs sm:text-sm opacity-90">
              Enjoy a faster and better experience on your phone.
            </p>
          </div>
        </div>

        <a
          href="https://www.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-bg"
        >
          Download App
        </a>
      </div>
    </div>
  );
};

export default AppDownloadBanner;