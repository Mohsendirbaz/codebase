/**
 * Utility functions for transforming file paths and album names
 */

/**
 * Transforms a file path to a URL for HTML files
 * @param {string} filePath - The file path to transform
 * @returns {string} The transformed URL
 */
export const transformHtmlPath = (filePath) => {
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
};

/**
 * Transforms a file path to a URL for PNG files
 * @param {string} filePath - The file path to transform
 * @returns {string} The transformed URL
 */
export const transformPngPath = (filePath) => {
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
};

/**
 * Transforms an album name for HTML content
 * @param {string} album - The album name to transform
 * @returns {string} The transformed album name
 */
export const transformHtmlAlbumName = (album) => {
    const match = album.match(/v((\d+_)+)(.+)/);
    if (match) {
        const versions = match[1].slice(0, -1).replace(/_/g, ', ');
        const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
};

/**
 * Transforms an album name for plot content
 * @param {string} album - The album name to transform
 * @returns {string} The transformed album name
 */
export const transformPlotAlbumName = (album) => {
    const match = album.match(/((\d+_)+)(.+)/);
    if (match) {
        const versions = match[1].slice(0, -1).replace(/_/g, ', ');
        const description = match[3].replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        return `${description} for versions [${versions}]`;
    }
    return album.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
};
