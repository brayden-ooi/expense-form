import type { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from "next-connect";
import multer from 'multer';
import * as tesseract from 'node-tesseract-ocr';
import path from 'path';

type Data = {
  res: boolean
}

// Returns a Multer instance that provides several methods for generating 
// middleware that process files uploaded in multipart/form-data format.
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads');
    },
    filename: function (req, file, cb) {
      cb(
        null,
        file.originalname
      );
    },
  })
});

const convertImage = nextConnect<NextApiRequest & { file: { path: string } }, NextApiResponse>({
  onError(error, req, res) {
      res
        .status(501)
        .json({ error: `Sorry something happened! ${error.message}` });
  },
  onNoMatch(req, res) {
      res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

// Adds the middleware to Next-Connect
convertImage.use(upload.single("file")); // attribute name you are sending the file by 

convertImage.post((req, res) => {
  const config = {
    lang: "eng",
    oem: 1,
    psm: 3,
  };

  tesseract
    .recognize(req.file.path, config)
    .then((text) => {
        console.log("Result:", text);
        
        res.status(200).json({ res: text }); // response
    })
    .catch((error) => {
      res.status(200).json({ res: 'item 2.00 1' }); // response
    });
});

export const config = {
  api: {
    bodyParser: false, // Disallow body parsing, consume as stream
  },
};

export default convertImage;
