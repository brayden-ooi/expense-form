// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { INITIAL_FORM_STATE } from 'lib/helpers/reducer';
import moment from 'moment';
import { OAuth2Client } from 'google-auth-library';

type Data = {
  res: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // sheet items
  const auth = new google.auth.GoogleAuth({
    keyFile: "lib/credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });

  // Create client instance for auth
  // https://github.com/googleapis/google-auth-library-nodejs/issues/1402
  const client = await auth.getClient() as OAuth2Client;

  // Instance of Google Sheets API
  const googleSheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = "SOME_SPREADSHEET_ID";
  const form = req.body as typeof INITIAL_FORM_STATE["form"];

  // input
  const sanitizedInput = [
    moment().format('DD/MM/YYYY hh:mm:ss'),
    form.email,
    moment(form.date).format('DD/MM/YYYY'),
    form.location,
    form.vendor,
    form.type,
    form.description.length ? form.description : form.items.map(({label, amount, price}) => `${amount}x ${label} RM${price}`).join('\n'),     // description,
    form.paid_by,
    `${form.items.reduce((accum, {price, amount}) => accum + (Number(price) * Number(amount)), 0)}`,
    `${form.ration["Name #1"].amount}${form.ration["Name #1"].unit}`,
    `${form.ration["Name #2"].amount}${form.ration["Name #2"].unit}`,
    `${form.ration["Name #3"].amount}${form.ration["Name #3"].unit}`,
    `${form.ration["Name #4"].amount}${form.ration["Name #4"].unit}`,
    'N/A',
    '',
    form.clearance,
  ]

  console.log(sanitizedInput);

  // Write row(s) to spreadsheet
  await googleSheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Form Responses",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        sanitizedInput
      ],
    },
  });

  res.status(200).json({ res: true })
}
