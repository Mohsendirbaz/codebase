import { useState, useEffect } from 'react';

export const useContentLoading = ({ activeTab }) => {
  const [loadingStates, setLoadingStates] = useState({
    html: false,
    csv: false,
    plots: false,
  });

  const [contentLoaded, setContentLoaded] = useState({});
  const [iframesLoaded, setIframesLoaded] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState({});

  const [contentLoadingState, setContentLoadingState] = useState({
    csv: false,
    html: false,
    plots: false,
    iframes: {},
    images: {},
    content: {},
  });

  useEffect(() => {
    setContentLoadingState((prev) => ({
      ...prev,
      csv: activeTab === 'Case1',
      html: activeTab === 'Case2',
      plots: activeTab === 'Case3',
      iframes: {},
      images: {},
      content: {},
    }));
  }, [activeTab]);

  useEffect(() => {
    if (contentLoadingState.csv || contentLoadingState.html || contentLoadingState.plots) {
      const timer = setTimeout(() => {
        setContentLoadingState((prev) => ({
          ...prev,
          content: { ...prev.content, [activeTab]: true },
        }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contentLoadingState.csv, contentLoadingState.html, contentLoadingState.plots, activeTab]);

  const handleIframeLoad = (index) => {
    setIframesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageLoad = (index) => {
    setImagesLoaded((prev) => ({ ...prev, [index]: true }));
  };

  return {
    loadingStates,
    contentLoaded,
    iframesLoaded,
    imagesLoaded,
    contentLoadingState,
    handleIframeLoad,
    handleImageLoad,
  };
};

export default useContentLoading;
