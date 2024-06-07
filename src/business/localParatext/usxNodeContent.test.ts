import { parseRef } from '../../crud/passage';
import { Passage } from '../../model';
import {
  bruteForceVerses,
  domVnum,
  firstVerse,
  getExistingVerses,
  getPassageVerses,
  getVerses,
  verseText,
} from './usxNodeContent';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
const domParser = new DOMParser();
const xmlSerializer = new XMLSerializer();

describe('usxNodeContent', () => {
  it('domVnum should return the verse number', () => {
    // Arrange
    const doc = domParser.parseFromString('<v number="1"/>', 'text/xml');
    const v = doc.getElementsByTagName('v')[0];

    // Act
    const result = domVnum(v);

    // Assert
    expect(result).toEqual([1, 1]);
  });

  it('domVnum should return the start and end verse number', () => {
    // Arrange
    const doc = domParser.parseFromString('<v number="2-3"/>', 'text/xml');
    const v = doc.getElementsByTagName('v')[0];

    // Act
    const result = domVnum(v);

    // Assert
    expect(result).toEqual([2, 3]);
  });

  it('domVnum should return the start and end verse number ignoring letters', () => {
    // Arrange
    const doc = domParser.parseFromString('<v number="2b-3a"/>', 'text/xml');
    const v = doc.getElementsByTagName('v')[0];

    // Act
    const result = domVnum(v);

    // Assert
    expect(result).toEqual([2, 3]);
  });

  it('firstVerse should return the first verse in a paragraph', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<para><verse number="1"/>V1<verse number="2"/>V2</para>',
      'text/xml'
    );
    const para = doc.getElementsByTagName('para')[0];

    // Act
    const result = firstVerse(para);

    // Assert
    expect(result.getAttribute('number')).toEqual('1');
    expect(xmlSerializer.serializeToString(result)).toEqual(
      '<verse number="1"/>'
    );
  });

  it('firstVerse should return the first verse in a paragraph ignoring text before', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para>',
      'text/xml'
    );
    const para = doc.getElementsByTagName('para')[0];

    // Act
    const result = firstVerse(para);

    // Assert
    expect(result.getAttribute('number')).toEqual('1');
    expect(xmlSerializer.serializeToString(result)).toEqual(
      '<verse number="1" style="v"/>'
    );
  });

  it('bruteForceVerses should return all verses in a paragraph', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para>',
      'text/xml'
    );
    const para = doc.getElementsByTagName('para')[0];
    const verses: Element[] = [];

    // Act
    bruteForceVerses(para, verses);

    // Assert
    expect(verses.length).toEqual(2);
    expect(verses[0].getAttribute('number')).toEqual('1');
    expect(verses[1].getAttribute('number')).toEqual('2');
    expect(xmlSerializer.serializeToString(verses[0])).toEqual(
      '<verse number="1" style="v"/>'
    );
  });

  it('getVerses should return all verses in a document', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para><para style="p">\r\n<verse number="3" style="v"/>V3<verse number="4" style="v"/>V4</para></usx>',
      'text/xml'
    );

    // Act
    const result = getVerses(doc.documentElement);

    // Assert
    expect(result.length).toEqual(4);
    expect(result[0].getAttribute('number')).toEqual('1');
    expect(result[1].getAttribute('number')).toEqual('2');
    expect(result[2].getAttribute('number')).toEqual('3');
    expect(result[3].getAttribute('number')).toEqual('4');
    expect(xmlSerializer.serializeToString(result[2])).toEqual(
      '<verse number="3" style="v"/>'
    );
  });

  it('getVerses should return all verses in a paragraph', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para><para style="p">\r\n<verse number="3" style="v"/>V3<verse number="4" style="v"/>V4</para></usx>',
      'text/xml'
    );
    const para2 = doc.getElementsByTagName('para')[1];

    // Act
    const result = getVerses(para2);

    // Assert
    expect(result.length).toEqual(2);
    expect(result[0].getAttribute('number')).toEqual('3');
    expect(result[1].getAttribute('number')).toEqual('4');
    expect(xmlSerializer.serializeToString(result[0])).toEqual(
      '<verse number="3" style="v"/>'
    );
  });

  it('getExistingVerses should return all verses in a document', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para><para style="p">\r\n<verse number="3" style="v"/>V3<verse number="4" style="v"/>V4</para></usx>',
      'text/xml'
    );
    const p = { attributes: { sequencenum: 1, reference: '1-4' } } as Passage;

    // Act
    parseRef(p);
    const result = getExistingVerses(doc, p);

    // Assert
    expect(result.allVerses.length).toEqual(4);
    expect(result.exactVerse).toBeUndefined();
  });

  it('getExistingVerses should include bridged verse in a document', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2-3" style="v"/>V2-3<verse number="4" style="v"/>V4</para></usx>',
      'text/xml'
    );
    const p = { attributes: { sequencenum: 1, reference: '1-4' } } as Passage;

    // Act
    parseRef(p);
    const result = getExistingVerses(doc, p);

    // Assert
    expect(result.allVerses.length).toEqual(3);
    expect(result.allVerses[1].getAttribute('number')).toEqual('2-3');
    expect(result.exactVerse).toBeUndefined();
  });

  it('getPassageVerses should return all verses in a document', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">\r\n<verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para><para style="p">\r\n<verse number="3" style="v"/>V3<verse number="4" style="v"/>V4</para></usx>',
      'text/xml'
    );
    const p = { attributes: { sequencenum: 1, reference: '1-4' } } as Passage;

    // Act
    parseRef(p);
    const result = getPassageVerses(doc, p);

    // Assert
    expect(result).toEqual('\\v 1 V1\\v 2 V2\n\\v 3 V3\\v 4 V4');
  });

  it('verseText should return the text of a verse', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para><verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para></usx>',
      'text/xml'
    );
    const v = doc.getElementsByTagName('verse')[0];

    // Act
    const result = verseText(v);

    // Assert
    expect(result).toEqual('V1');
  });
});
