import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import CustomizableImage from '../../CustomizableImage';
import { transformPngPath, transformPlotAlbumName } from '../../utils/pathTransformers';

const PlotContentTab = ({ albumImages, selectedAlbum, setSelectedAlbum, imagesLoaded, setImagesLoaded }) => {
    const renderPlotContent = () => {
        if (!selectedAlbum || !albumImages[selectedAlbum]) return null;

        return albumImages[selectedAlbum].map((image, index) => {
            const imageUrl = transformPngPath(image.path);
            return (
                <div key={index} className={`plot-content ${imagesLoaded[index] ? 'loaded' : ''}`}>
                    <CustomizableImage
                        src={imageUrl}
                        alt={image.name}
                        width="600"
                        height="400"
                        style={{ margin: '10px' }}
                        onLoad={() => {
                            setImagesLoaded((prev) => ({ ...prev, [index]: true }));
                        }}
                        className={imagesLoaded[index] ? 'loaded' : ''}
                    />
                </div>
            );
        });
    };

    if (!albumImages || Object.keys(albumImages).length === 0) {
        return <div>No PNG files available</div>;
    }

    return (
        <Tabs
            selectedIndex={Object.keys(albumImages).indexOf(selectedAlbum)}
            onSelect={(index) => setSelectedAlbum(Object.keys(albumImages)[index])}
        >
            <TabList>
                {Object.keys(albumImages).map((album) => (
                    <Tab key={album}>{transformPlotAlbumName(album)}</Tab>
                ))}
            </TabList>
            {Object.keys(albumImages).map((album) => (
                <TabPanel key={album}>{renderPlotContent()}</TabPanel>
            ))}
        </Tabs>
    );
};

export default PlotContentTab;
