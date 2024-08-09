import {
  isAfterSection,
  isEmptyPara,
  isNote,
  isPara,
  isSection,
  isText,
  isVerse,
} from './usxNodeType';
import { DOMParser } from '@xmldom/xmldom';
const domParser = new DOMParser();

describe('usxNodeType', () => {
  it('isText should return true for a text node', () => {
    // Arrange
    const doc = domParser.parseFromString('<para>text</para>', 'text/xml');
    const para = doc.getElementsByTagName('para')[0];

    // Act
    const result = isText(para.firstChild);
    const result2 = isText(para);

    // Assert
    expect(result).toEqual(true);
    expect(result2).toEqual(false);
  });

  it('isPara should return true for a para node', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<para style="p">text</para>',
      'text/xml'
    );
    const para = doc.getElementsByTagName('para')[0];

    // Act
    const result = isPara(para.firstChild);
    const result2 = isPara(para);

    // Assert
    expect(result).toEqual(false);
    expect(result2).toEqual(true);
  });

  it('isSection should return true for a section node', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">text</para><para style="s">text</para></usx>',
      'text/xml'
    );
    const para1 = doc.getElementsByTagName('para')[0] as Element;
    const para2 = doc.getElementsByTagName('para')[1] as Element;

    // Act
    const result = isSection(para1?.firstChild);
    const result2 = isSection(para1);
    const result3 = isSection(para2);
    const result4 = isSection(para2?.firstChild);

    // Assert
    expect(result).toEqual(false);
    expect(result2).toEqual(false);
    expect(result3).toEqual(true);
    expect(result4).toEqual(false);
  });

  it('isVerse should return true for a verse node', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"><verse number="1" style="v"/>text</para></usx>',
      'text/xml'
    );
    const verse = doc.getElementsByTagName('verse')[0];

    // Act
    const result = isVerse(verse);
    const result2 = isVerse(verse?.firstChild);
    const result3 = isVerse(verse?.parentNode);

    // Assert
    expect(result).toEqual(true);
    expect(result2).toEqual(false);
    expect(result3).toEqual(false);
  });

  it('isNote should return true for a note node', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><note>text</note></usx>',
      'text/xml'
    );
    const note = doc.getElementsByTagName('note')[0];

    // Act
    const result = isNote(note);
    const result2 = isNote(note?.firstChild);

    // Assert
    expect(result).toEqual(true);
    expect(result2).toEqual(false);
  });

  it('isEmptyPara should return true for an empty para node', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p"/><para style="p"> </para><para style="p">\r\n<verse number="1" style="v"/>V1</para></usx>',
      'text/xml'
    );
    const para1 = doc.getElementsByTagName('para')[0];
    const para2 = doc.getElementsByTagName('para')[1];
    const para3 = doc.getElementsByTagName('para')[2];

    // Act
    const result = isEmptyPara(para1);
    const result2 = isEmptyPara(para2);
    const result3 = isEmptyPara(para3);

    // Assert
    expect(result).toEqual(true);
    expect(result2).toEqual(true);
    expect(result3).toEqual(false);
  });

  it('isAfterSection should return the section before a para', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">P1</para><para style="s">S1</para><para style="p"><verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para><para style="p"><verse number="3" style="v"/>V3</para></usx>',
      'text/xml'
    );
    const para1 = doc.getElementsByTagName('para')[0];
    const para2 = doc.getElementsByTagName('para')[1];
    const para3 = doc.getElementsByTagName('para')[2];
    const para4 = doc.getElementsByTagName('para')[3];

    // Act
    const result = isAfterSection(para1);
    const result2 = isAfterSection(para2);
    const result3 = isAfterSection(para3);
    const result4 = isAfterSection(para4);

    // Assert
    expect(result).toEqual(undefined);
    expect(result2).toEqual(undefined);
    expect(result3).toEqual(undefined);
    expect(result4).toEqual(undefined);
    // isAfterSection is not working if the content doesn't have intersperced text
  });

  it('isAfterSection should return the section before a para when text starts the paragraph', () => {
    // Arrange
    const doc = domParser.parseFromString(
      '<usx><para style="p">P1</para>\n<para style="s">S1</para>\n<para style="p"><verse number="1" style="v"/>V1<verse number="2" style="v"/>V2</para>\n<para style="p"><verse number="3" style="v"/>V3</para></usx>',
      'text/xml'
    );
    const para1 = doc.getElementsByTagName('para')[0];
    const para2 = doc.getElementsByTagName('para')[1];
    const para3 = doc.getElementsByTagName('para')[2];
    const para4 = doc.getElementsByTagName('para')[3];

    // Act
    const result = isAfterSection(para1);
    const result2 = isAfterSection(para2);
    const result3 = isAfterSection(para3);
    const result4 = isAfterSection(para4);

    // Assert
    expect(result).toEqual(undefined);
    expect(result2).toEqual(undefined);
    expect(result3?.firstChild?.textContent).toEqual('S1');
    expect(result4).toEqual(undefined);
    // isAfterSection works if each paragraph tag starts a line
  });
});
