function showAWSCredentialsDialog() {
  var html = HtmlService.createHtmlOutputFromFile('AWSCredentialsDialog')
      .setWidth(600)
      .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, 'AWS Credentials');
}

function getS3File(s3, bucketName, objectKey) {
  // バケット名とファイル名を指定してファイルの中身を取得
  const data = s3.getObject(bucketName, objectKey);
  return data;
}

function exportDataToSpreadSheet(data) {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.clear()
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

function readTable(accessKeyId, secretAccessKey, sessionToken) {
  try {
    const s3 = getInstance(accessKeyId, secretAccessKey, sessionToken);
    const bucketName = '<YOUR BUCKET NAME>';
    const objectKey = '<YOUR OBJECT KEY>';
   
    const data = getS3File(s3, bucketName, objectKey);
    const parsedData = Utilities.parseCsv(data.getDataAsString());

    // 読み込んだデータを展開
    exportDataToSpreadSheet(parsedData);
    
    return 'ファイルの読み込みが完了しました';
  } catch (error) {
    Logger.log('Error in readTable: ' + error.toString());
    throw new Error('ファイルの読み込み中にエラーが発生しました: ' + error.message);
  }
}

function putS3File(s3, bucketName, objectKey) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // データが存在する範囲を取得
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();
  
  // 送信データ用の配列を用意
  let csv = '';

  // データをチェックしながらループ
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // 行に少なくとも1つの非空セルがある場合
    if (row.some(cell => cell !== '')) {
      // データを作成（すべての列を含める）
      csv += row.map(cell => `"${cell}"`).join(',') + "\n";
    }
  }

  // バイナリに変換
  const csvBlob = Utilities.newBlob(csv, 'text/csv');

  s3.putObject(bucketName, objectKey, csvBlob);
}

function writeTable(accessKeyId, secretAccessKey, sessionToken) {
  try {
    const s3 = getInstance(accessKeyId, secretAccessKey, sessionToken);
    const bucketName = '<YOUR BUCKET NAME>';
    const objectKey = '<YOUR OBJECT KEY>';
    putS3File(s3, bucketName, objectKey)

    return 'ファイルの書き込みが完了しました。';
  } catch (error) {
    Logger.log('Error in writeTable: ' + error.toString());
    throw new Error('ファイルの書き込み中にエラーが発生しました: ' + error.message);
  }
}
