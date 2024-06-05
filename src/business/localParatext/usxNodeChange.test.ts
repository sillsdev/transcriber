import {
  addAfter,
  findNodeAfterVerse,
  newEl,
  moveToPara,
  paratextPara,
  paratextSection,
} from './usxNodeChange';
import { DOMParser } from 'xmldom';
const domParser = new DOMParser();

describe('usxNodeChange', () => {
  it('should create a new Element with the given style', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    // Act
    const result = newEl(doc, 'v', 'bold: true');
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect(result.getAttribute('style')).toBe('bold: true');
  });

  it('should create a new Element with the given style and verse number', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    // Act
    const result = newEl(doc, 'v', 'bold: true', '1');
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect(result.getAttribute('style')).toBe('bold: true');
    expect(result.getAttribute('number')).toBe('1');
  });

  it('should create a node after the given node', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx><v/><v/></usx>');
    const node = doc.getElementsByTagName('v')[0];
    const node1b = newEl(doc, 'v', 'bold: true', '1b');

    // Act
    const result = addAfter(doc, node, node1b);

    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect((result as Element).getAttribute('style')).toBe('bold: true');
    expect(result.nextSibling).toBe(doc.getElementsByTagName('v')[2]);
    expect(doc.documentElement?.toString()).toBe(
      '<usx><v/><v number="1b" style="bold: true"/><v/></usx>'
    );
  });

  it('should create a node at the end when last is null', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx><v/><v/></usx>');
    const node1b = newEl(doc, 'v', 'bold: true', '1b');

    // Act
    const result = addAfter(doc, null, node1b);

    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect((result as Element).getAttribute('style')).toBe('bold: true');
    expect(result.nextSibling).toBeNull();
    expect(doc.documentElement?.toString()).toBe(
      '<usx><v/><v/><v number="1b" style="bold: true"/></usx>'
    );
  });

  it('should create a node at the end when last is undefined', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx><v/><v/></usx>');
    const node1b = newEl(doc, 'v', 'bold: true', '1b');

    // Act
    const result = addAfter(doc, undefined, node1b);

    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect((result as Element).getAttribute('style')).toBe('bold: true');
    expect(result.nextSibling).toBeNull();
    expect(doc.documentElement?.toString()).toBe(
      '<usx><v/><v/><v number="1b" style="bold: true"/></usx>'
    );
  });

  it('should create the only node when last is undefined', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    const node1b = newEl(doc, 'v', 'bold: true', '1b');

    // Act
    const result = addAfter(doc, undefined, node1b);

    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('v');
    expect((result as Element).getAttribute('style')).toBe('bold: true');
    expect(result.nextSibling).toBeNull();
    expect(doc.documentElement?.toString()).toBe(
      '<usx><v number="1b" style="bold: true"/></usx>'
    );
  });

  it('should create a new paragraph with the given style', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    // Act
    const result = paratextPara(doc, 'p');
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.getAttribute('style')).toBe('p');
  });

  it('should create a new paragraph with the given style and child', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    const child = doc.createTextNode('text');
    // Act
    const result = paratextPara(doc, 'p', child);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.getAttribute('style')).toBe('p');
    expect(result.childNodes[1]).toBe(child);
  });

  it('should create a new paragraph with the given style and temporary attribute', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    // Act
    const result = paratextPara(doc, 'p', null, 'tmp', 'value');
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.getAttribute('style')).toBe('p');
    expect(result.getAttribute('tmp')).toBe('value');
  });

  it('should create a new section with the given text', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx/>');
    // Act
    const result = paratextSection(doc, 'text');
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.getAttribute('style')).toBe('s');
    expect(result.childNodes[1].nodeValue).toBe('text');
  });

  it('should return the verse if it is already a paragraph', async () => {
    // Arrange
    const doc = domParser.parseFromString('<usx><para/></usx>');
    const verse = doc.getElementsByTagName('para')[0];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
  });

  it('should move the verse to a new paragraph', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse>\r\n<verse number="2" style="v">T2</verse></para></usx>'
    );
    const verse = doc.getElementsByTagName('verse')[1];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.childNodes[1].nodeName).toBe('verse');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse>\r\n</para><para style="p">\r\n<verse number="2" style="v">T2</verse></para></usx>'
    );
  });

  it('should move the verse to a new paragraph without previous text', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse></para></usx>'
    );
    const verse = doc.getElementsByTagName('verse')[1];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.childNodes[1].nodeName).toBe('verse');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse></para><para style="p">\r\n<verse number="2" style="v">T2</verse></para></usx>'
    );
  });

  it('should move the verse to a new paragraph if not in a paragraph', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse></usx>'
    );
    const verse = doc.getElementsByTagName('verse')[1];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.childNodes[1].nodeName).toBe('verse');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><verse number="1" style="v">T1</verse><para style="p">\r\n<verse number="2" style="v">T2</verse></para></usx>'
    );
  });

  it('should move the verse to a new paragraph with following siblings', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse><verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    const verse = doc.getElementsByTagName('verse')[1];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.childNodes[1].nodeName).toBe('verse');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse></para><para style="p">\r\n<verse number="2" style="v">T2</verse><verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
  });

  it('should move the verse to a new paragraph with following siblings and previous text', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse><verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    const verse = doc.getElementsByTagName('verse')[2];
    // Act
    const result = moveToPara(doc, verse);
    // Assert
    expect(result).toBeDefined();
    expect(result.nodeName).toBe('para');
    expect(result.childNodes[1].nodeName).toBe('verse');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse></para><para style="p">\r\n<verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
  });

  it('should put the starting verse at the beginning of a new paragraph', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse><verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    const verses = Array.from(doc.getElementsByTagName('verse')) as Element[];
    // Act
    const result = findNodeAfterVerse(doc, verses, 2, 2);
    // Assert
    expect(result).toBeDefined();
    expect(result?.nodeName).toBe('para');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse></para><para style="p">\r\n<verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    expect((result?.childNodes[1] as Element).getAttribute('number')).toBe('3');
  });

  it('should put the starting verse of a range at the beginning of a new paragraph', async () => {
    // NOTE: it isn't putting a new paragraph after the range of verses
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse><verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    const verses = Array.from(doc.getElementsByTagName('verse')) as Element[];
    // Act
    const result = findNodeAfterVerse(doc, verses, 2, 3);
    // Assert
    expect(result).toBeDefined();
    expect(result?.nodeName).toBe('para');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1" style="v">T1</verse><verse number="2" style="v">T2</verse></para><para style="p">\r\n<verse number="3" style="v">T3</verse><verse number="4" style="v">T4</verse></para></usx>'
    );
    expect((result?.childNodes[1] as Element).getAttribute('number')).toBe('3');
  });

  it('should return null if the starting verse is not found', async () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1-4" style="v">T1-4</verse></para></usx>'
    );
    const verses = Array.from(doc.getElementsByTagName('verse')) as Element[];
    // Act
    const result = findNodeAfterVerse(doc, verses, 2, 3);
    // Assert
    expect(result).toBeUndefined();
  });

  it('should return paragraph node if verse alread starts a paragraph', async () => {
    // NOTE: search range doesn't include full verse range
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1-4" style="v">T1-4</verse></para></usx>'
    );
    const verses = Array.from(doc.getElementsByTagName('verse')) as Element[];
    // Act
    const result = findNodeAfterVerse(doc, verses, 1, 3);
    // Assert
    expect(result).toBeDefined();
    expect(result?.nodeName).toBe('para');
    expect(doc.documentElement?.toString()).toBe(
      '<usx><para style="p"><verse number="1-4" style="v">T1-4</verse></para></usx>'
    );
    // NOTE: Text node not inserted if paragraph node not created
    expect((result?.childNodes[0] as Element).getAttribute('number')).toBe(
      '1-4'
    );
  });
});
