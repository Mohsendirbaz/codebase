import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { transformHtmlPath, transformHtmlAlbumName } from '../../utils/pathTransformers';

const HtmlContentTab = ({ albumHtmls, selectedHtml, setSelectedHtml, iframesLoaded, setIframesLoaded }) => {

    const renderHtmlContent = () => {
        if (!selectedHtml || !albumHtmls[selectedHtml]) return null;

        return albumHtmls[selectedHtml].map((html, index) => {
            const htmlUrl = transformHtmlPath(html.path);
            return (
                <div key={index} className={`html-content ${iframesLoaded[index] ? 'loaded' : ''}`}>
                    <iframe
                        src={htmlUrl}
                        title={html.name}
                        width="100%"
                        height="600px"
                        style={{ margin: '10px' }}
                        onLoad={() => {
                            setIframesLoaded((prev) => ({ ...prev, [index]: true }));
                        }}
                        className={iframesLoaded[index] ? 'loaded' : ''}
                    />
                </div>
            );
        });
    };

    if (!albumHtmls || Object.keys(albumHtmls).length === 0) {
        return <div>No HTML files available</div>;
    }

    return (
        <Tabs
            selectedIndex={Object.keys(albumHtmls).indexOf(selectedHtml)}
            onSelect={(index) => setSelectedHtml(Object.keys(albumHtmls)[index])}
        >
            <TabList>
                {Object.keys(albumHtmls).map((album) => (
                        <Tab key={album}>{transformHtmlAlbumName(album)}</Tab>
                ))}
            </TabList>
            {Object.keys(albumHtmls).map((album) => (
                <TabPanel key={album}>{renderHtmlContent()}</TabPanel>
            ))}
        </Tabs>
    );
};

export default HtmlContentTab;
