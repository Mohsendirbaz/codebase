import { apiService } from './apiService';

export const contentService = {
  async fetchCsvFiles(version) {
    try {
      const data = await apiService.fetchData(apiService.endpoints.csvFiles(version));

      // Handle null or undefined response
      if (!data) {
        return [];
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('Unexpected response format: Expected array of CSV files');
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching CSV files:', error);
      throw error;
    }
  },

  async fetchHtmlFiles(version) {
    try {
      const data = await apiService.fetchData(apiService.endpoints.albumHtml(version));

      // Handle null or undefined response
      if (!data) {
        return {};
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('Unexpected response format: Expected array of HTML files');
        return {};
      }

      // Group HTML files by album
      return data.reduce((acc, html) => {
        const { album } = html;
        if (!acc[album]) {
          acc[album] = [];
        }
        acc[album].push(html);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching HTML files:', error);
      throw error;
    }
  },

  async fetchImages(version) {
    try {
      const data = await apiService.fetchData(apiService.endpoints.albumImages(version));
      
      // Handle null or undefined response
      if (!data) {
        return {};
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('Unexpected response format: Expected array of images');
        return {};
      }

      // Group images by album
      return data.reduce((acc, image) => {
        const { album } = image;
        if (!acc[album]) {
          acc[album] = [];
        }
        acc[album].push(image);
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  },

  transformPathToUrl(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const match = normalizedPath.match(
      /Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.png)$/
    );

    if (match) {
      const version = match[1];
      const album = match[2];
      const fileName = match[3];
      return `http://localhost:5008/images/Batch(${version})/Results(${version})/${album}/${fileName}`;
    }
    return normalizedPath;
  },

  transformPathToUrlh(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const baseUrl = `http://localhost:3000/Original`;

    const match = normalizedPath.match(
      /Batch\((\d+)\)\/Results\(\d+\)\/([^\/]+)\/([^\/]+\.html)$/
    );
    if (match) {
      const version = match[1];
      const album = match[2];
      const fileName = normalizedPath.split('/').pop();
      return `${baseUrl}/Batch(${version})/Results(${version})/${album}/${fileName}`;
    }
    return normalizedPath;
  },

  transformAlbumName(album) {
    const match = album.match(/v((\d+_)+)(.+)/);
    if (match) {
      const versions = match[1].slice(0, -1).replace(/_/g, ', ');
      const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  },

  transformAlbumNamePlot(album) {
    const match = album.match(/((\d+_)+)(.+)/);
    if (match) {
      const versions = match[1].slice(0, -1).replace(/_/g, ', ');
      const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  }
};

export default contentService;
