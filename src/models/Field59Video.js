/**
 * Represents a video for the Field59 API
 */
class Field59Video {
  /**
   * Create a new Field59Video
   * @param {Object} videoData - The video data
   * @param {string} videoData.url - URL of the source video
   * @param {string} videoData.title - Title of the video
   * @param {string} [videoData.summary=''] - Summary description
   * @param {string[]} [videoData.tags=[]] - Array of tags
   * @param {string} [videoData.category=''] - Category for the video
   * @param {string} [videoData.description=''] - Longer description
   */
  constructor({ url, title, summary = '', tags = [], category = '', description = '' }) {
    this.url = url;
    this.title = title;
    this.summary = summary;
    this.tags = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    this.category = category;
    this.description = description;
  }

  /**
   * Generate XML for Field59 API
   * @returns {string} XML string for the video
   */
  toXml() {
    const tagsXml = this.tags.length > 0 
      ? `<tags>${this.tags.map(tag => `<tag><![CDATA[${tag}]]></tag>`).join('')}</tags>` 
      : '';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<video>
  <title><![CDATA[${this.title}]]></title>
  <url><![CDATA[${this.url}]]></url>
  ${this.summary ? `<summary><![CDATA[${this.summary}]]></summary>` : ''}
  ${this.description ? `<description><![CDATA[${this.description}]]></description>` : ''}
  ${this.category ? `<category><![CDATA[${this.category}]]></category>` : ''}
  ${tagsXml}
</video>`;
  }
}

export default Field59Video; 