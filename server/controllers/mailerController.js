import catchAsync from '../helpers/catchAsync';

import Mailer from '../models/Mailer';
import Submitanideael from '../models/SubmitAnIdeaEl';
import ResponseObject from '../helpers/responseObjectClass';
import multiparty from 'multiparty';
import excelToJson from 'convert-excel-to-json';
import { Op } from 'sequelize';
import sgMail from '@sendgrid/mail';
import config from '../../config/env';
import Excel from 'exceljs';
import axios from 'axios';

import azureConnection from '../helpers/azureConnection';
import { htmlToPdf } from '../helpers/mailer';
import UserBot from '../models/BotUser';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import moment from 'moment';

// templates
const pdfMailerTemplateV1 = path.join(__dirname, '../templates/pdfMailerTemplate.ejs');
const pdfMailerTemplateV2 = path.join(__dirname, '../templates/pdfMailerTemplateV2.ejs');

var mailResponse = '';

const createTemplate = (templateData) => {
  if (templateData.type == 'Automation Demo') {
    let requsetADemo = {
      user: templateData.user,
      leadPlatfrom: templateData.leadPlatfrom,
      technology: templateData.technology,
      cluster: templateData.cluster,
      remark: templateData.remark,
    };
    let requestDemoTemplate = `<!DOCTYPE html>
    <html lang="en">
    <head>
     <meta charset="UTF-8">
     <meta http-equiv="X-UA-Compatible" content="IE=edge">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Document</title>
    </head>
    <body>
     <section id="containt" style="background-color: #deeaf6;"> 
     <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
     <p>Hi <span id="user"> ${requsetADemo.user}</span>,</p>
     <p>Thank you for reaching out!</p>
     <p style="max-width: 30rem; font-size: 0.95rem;">We have received request for demo of Platform <span id="platform"> ${requsetADemo.leadPlatfrom},</span> Technology <span id="technology"> ${requsetADemo.technology} </span> for Cluster <span id="cluster"> ${requsetADemo.cluster}</span>.
     <br/>
     Remarks: ${requsetADemo.remark} </p>
     <p>We will get in touch with you shortly.</p>
     <p>
     Regards,<br/>
     Automation Factory
     </p>
     </div> 
     </section>
    </body>
    </html>
`;
    return requestDemoTemplate;
  } else if (templateData.type == 'Contact') {
    console.log('----------------herer contact mailer -----');
    console.log('inside contact', templateData);

    let contactTempalte = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <section id="containt" style="background-color: #deeaf6;">     
        <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
            <p>Hi 
            <span id="user">${templateData.mailData.name}</span>,    
            </p>
            <p style="max-width: 30rem; font-size: 0.95rem;">
            We have received your queries regarding
             <span id="needHelp"> ${templateData.mailData.enquiryProductType}</span>.
             <br/>
                Message: ${templateData.mailData.enquiryMessage}
                <p>We will get in touch with you shortly.</p>
                Regards,<br/>
                Automation Factory
            </p>
        </div>        
    </section>
</body>
</html>
    `;
    return contactTempalte;
  } else if (templateData.type == 'Bot Request') {
    console.log('Template Data  ----', templateData);
    let Bottemplate = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section id="containt" style="background-color: #deeaf6;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user">${templateData.user}</span>,
                </p>
                <p>Thank you for reaching out!</p>
                <p style="max-width: 30rem; font-size: 0.95rem;">We have received request for <span id="botID">Bot ID ${templateData.botID} </span> from Platform<span id="platform"> ${templateData.leadPlatfrom}</span>, <span id="technology">Technology ${templateData.technology} </span>in Cluster <span id="cluster"> ${templateData.cluster}</span>.
                <br/>
                Reason: ${templateData.remark}
                <p> We will get in touch with you shortly.</p>
                <p>
                    Regards,<br/>
                    Automation Factory
                </p>
            </div>       
        </section>
    </body>
    </html>`;
    return Bottemplate;
  }
};

// create mailer through file
const createMailerThroughFile = catchAsync(async (req, res, next) => {
  // mailer datatbase
  let form = new multiparty.Form();
  form.parse(req, async function (err, fields, files) {
    const json = excelToJson({
      sourceFile: files.mailer[0].path,
    });

    if (json['Sheet1']) {
      json['Sheet1'].map(async (obj, index) => {
        let tempObj = {};
        if (index > 0) {
          for (const [key, value] of Object.entries(json['Sheet1'][0])) {
            tempObj[json['Sheet1'][0][key]] = obj[key];
          }

          await Mailer.sync();
          let mailerRep = Mailer.build(tempObj);
          await mailerRep.save();

          if (index == json['Sheet1'].length - 1) {
            res.send(new ResponseObject(200, 'Successfully Created ', true, mailerRep));
          }
        }
      });
    }
  });
});

// export mailer
const exportMailerData = catchAsync(async (req, res, next) => {
  // fetch and send to the user
  const mailerData = await Mailer.findAll();
  console.log('length ---', mailerData.length);
  // push to array
  let mailerArray = [];
  mailerData.forEach((item) => {
    mailerArray.push(item.dataValues);
  });

  let workbook = await new Excel.Workbook();
  let sheet1 = await workbook.addWorksheet('Sheet1');
  let headers = [];
  for (let i in mailerArray[0]) {
    headers[i] = i;
  }
  sheet1.addRow().values = Object.values(headers);
  for (let i in mailerArray) {
    sheet1.addRow().values = Object.values(mailerArray[i]);
  }
  //return;
  //
  let date = new Date().toISOString();
  date = date.split('.')[0].replaceAll(':', '-');
  console.log('date', date);
  let fileName = `./ExcelFiles/Lead_Cluster_Email_Mapping${date}.xlsx`;
  console.log('FileName', fileName);
  await workbook.xlsx.writeFile(fileName);
  const azureResponse = await azureConnection.uploadLocalFile('botstorevideo', fileName);
  console.log('Export All Azure response ---', azureResponse);
  res.send(
    new ResponseObject(
      200,
      'Sucessfully Exported',
      true,
      `${config.fileUpload}/ExcelFiles/Lead_Cluster_Email_Mapping${date}.xlsx`
    )
  );
});

const getMailTo = async (leadPlatfrom, cluster) => {
  //console.log('lead paltform ', leadPlatfrom);
  //console.log('cluster ', cluster);
  let elArray = [];
  const findEngagementLead = await Mailer.findAll({
    where: {
      leadPlatform: leadPlatfrom,
      cluster: cluster,
      el: {
        [Op.not]: 'To be Updated',
      },
    },
  });
  console.log('find engagement lead  ---', findEngagementLead);
  findEngagementLead.forEach((elData) => {
    elArray.push(elData.dataValues.el);
  });
  //return findEngagementLead[0].dataValues.el;
  return elArray;
};

const sendMail = catchAsync(async (req, res, next) => {});

// public api mailer
const getEl = catchAsync(async (req, res) => {
  console.log('lead paltform ', req.query.leadPlatfrom);
  console.log('cluster ', req.query.cluster);
  const { leadPlatform, cluster } = req.query;
  const findEl = await Mailer.findAll();
  console.log('find el --', findEl);
  if (!_.isEmpty(leadPlatform) && !_.isEmpty(cluster)) {
    const findEngagementLead = await Mailer.findAll({
      where: {
        leadPlatform: leadPlatform,
        cluster: cluster,
      },
    });
    console.log('ffff', findEngagementLead);
    if (findEngagementLead.length != 0) {
      console.log('find engagement lead  ---', findEngagementLead[0].dataValues.el);
      res.send(
        new ResponseObject(200, 'Engagement lead', true, findEngagementLead[0].dataValues.el)
      );
    } else {
      res.send(new ResponseObject(404, 'No such engagement lead', false, {}));
    }
  } else {
    //res.status(422);u
    res.send(new ResponseObject(404, 'Parameters missing', false, {}));
  }
});

// get this bot and request a demo  mailer method
const getThisBotMailer = async (mailData) => {
  //console.log('get this bot  ---', mailData);
  let requsetADemo = {};
  requsetADemo.user = mailData.user.name;
  requsetADemo.leadPlatfrom = mailData.mailData.leadPlatform;
  requsetADemo.cluster = mailData.mailData.cluster;
  requsetADemo.technology = mailData.mailData.technology;
  requsetADemo.remark = mailData.mailData.remark;
  // get user Email for cc
//vvvvv  let userEmail = mailData.user.email;
//vvvvvv  let cc = [];
//vvvvvv  let toMail = [];
//vvvvvv  toMail.push(userEmail);
  let GetMailResposne = await getMailTo(mailData.mailData.leadPlatform, mailData.mailData.cluster);
 // console.log('el------------', GetMailResposne);

  for (let i = 0; i < GetMailResposne.length; i++) {
//vvvvvv    cc.push(GetMailResposne[i]);
  }
  //toMail.concat(GetMailResposne);

  let msg = '';
  let subject = '';
  if (mailData.requestType == 'Automation Demo' || mailData.requestType == 'Bot Request') {
    if (mailData.requestType == 'Automation Demo') {
      requsetADemo.type = 'Automation Demo';
      subject = requsetADemo.type;
    }
    if (mailData.requestType == 'Bot Request') {
      console.log('here');
      requsetADemo.type = 'Bot Request';
      requsetADemo.botID = mailData.mailData.botID;
      requsetADemo.remark = mailData.mailData.message;
      subject = `${requsetADemo.type}-${mailData.mailData.botID}`;
    }

    let mailTemplate = createTemplate(requsetADemo);
    console.log('mail template  ---', mailTemplate);

    // cc.push(config.ccSendGrid);
//    console.log('ccList  ----', cc);
 //   console.log('to list --', toMail);

    // un comment this code in production;

    if (toMail.length == 0) {
      console.log('herer no to mail');
      return true;
    }
    // comment this line in production
    //toMail = ['sanjay.sharma@unilever.com'];

    msg = await createMessage(toMail, config.sendGridFrom, cc, subject, mailTemplate);
    console.log('msg --', msg);
    // return;
    mailResponse = await sendMailSg(msg);
   // console.log('mail response ---', mailResponse);
  }
  return true;
};

const sendMailSg = async (msg) => {
  console.log('inside send mail sq', msg );
  try {
    sgMail.setApiKey(config.sendGridApiKey);

    console.log('message ---', msg);
    await sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent');
        return true;
      })
      .catch((error) => {
        console.error("error to sent mail",error);
        return false;
      });
  } catch (e) {
    console.log(e);
  }
};

const createMessage = async (to, from, cc, subject, mailTemplate, attachment, botId, timestamp) => {
  // console.log('to ', to, 'from ', from, 'subject ', subject, 'text ', text);
  if (_.isEmpty(to)) {
    //   to = [];
    //   to.push('automation.factory@unilever.com');
    console.log('Cannot send mail as To list is empty.');
  }
  // cc.push('automation.factory@unilever.com');
  const msg = {
    to: to.filter((item, i, ar) => ar.indexOf(item) === i && !_.isEmpty(item)),
    from: from,
    cc: cc.filter(
      (item, i, ar) => ar.indexOf(item) === i && !_.includes(to, item) && !_.isEmpty(item)
    ),
    subject: subject,
    text: subject,
    html: mailTemplate,
  };
  if (!_.isEmpty(attachment)) {
    var pathToAttachment = `./tempFiles/` + attachment;
    var attachment = fs.readFileSync(pathToAttachment).toString('base64');
    _.set(msg, 'attachments', [
      {
        content: attachment,
        filename: 'GFCF Approval' + botId + '.pdf',
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ]);
  }
  console.log('Returning message before emailing' + JSON.stringify);
  return msg;
};

const contactMailer = async (mailData) => {
  let userEmail = mailData.user.email;
//vvvvvv  console.log('mail data -', mailData.mailData);
//vvvvvv  console.log('common cc --', config.ccSendGrid);
//vvvvvv  console.log('user email --', userEmail);

//vvvvvv  let cc = [];
  if (mailData.mailData.UserEmail !== userEmail) {
    // cc.push(mailData.mailData.UserEmail);
    // cc.push(mailData.mailData.UserEmail, config.ccSendGrid);
  } else {
    // cc.push(config.ccSendGrid);
  }

//vvvvvv  console.log('cc----', cc);

//vvvvvv  let toMail = [];
//vvvvvv  console.log('To mail --', mailData.mailData.UserEmail);
//vvvvvv  toMail.push(userEmail);
  // create template
  let template = createTemplate(mailData);

  // create msg
  let msg = await createMessage(
    toMail,
//vvvvvv    config.sendGridFrom,
    cc,
    `${mailData.type} Automation Factory`,
    template
  );

  console.log('final mail message ---', msg);

  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  // // send mail

  return true;
};

// bot create and update template
const botMailerTemplate = async (templateData) => {
  let approverTemp = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section id="containt" style="background-color: #8ab4df;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user"></span>All,<br/>                   
                </p>
                <p>Thank you for reaching out!<p/>
                <p style="max-width: 30rem; font-size: 0.95rem;">There is an approval request pending for Bot id <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span>. <br>
                    <a href=${config.apporvalPortalLink}>Link to the approval portal</a></p>
                <p>
                    Regards,<br/>
                    Automation Factory
                </p>
            </div>       
        </section>
    </body>
    </html>`;
  return approverTemp;
};

var getMailerTemplate = (mailType, templateData) => {
  var template = '';
  switch (mailType) {
    case 'firstLevelGpmHasApproved':
      template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Point9</title>
      </head>
      
      <body>
          <section id="containt" style="background-color: #deeaf6;">     
              <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                  <p>Hi <span id="user">${templateData.toName}</span>,</p>          
                  <p style="font-size: 0.95rem;">The First Level GPM approval for Bot ID <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span> is complete. Your final approval is pending.</p>             
                  <p>Link to the approval portal: <a href="${config.apporvalPortalLink}">${config.apporvalPortalLink}</a></p> 
                  <p>Regards,<br/>Automation Factory</p>
              </div>       
          </section>
      
          <script>
                  document.getElementById("user").innerHTML = "User";
                  document.getElementById("botId").innerHTML = "Bot Id";
                  document.getElementById("prcoessName").innerHTML = "Prcoess Name";
          </script>
      </body>
      </html>`;
      break;
    case 'secondLevelGpmHasApproved':
      template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Point9</title>
      </head>
      
      <body>
          <section id="containt" style="background-color: #deeaf6;">     
              <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                  <p>Hi <span id="user"></span>All,</p>          
                  <p style="font-size: 0.95rem;">The GPM approval request for Bot ID <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span> is complete.</p>             
                  <p>Regards,<br/>Automation Factory</p>
              </div>       
          </section>
      
          <script>
                  document.getElementById("user").innerHTML = "User";
                  document.getElementById("botId").innerHTML = "Bot Id";
                  document.getElementById("prcoessName").innerHTML = "Prcoess Name";
          </script>
      </body>
      </html>`;
      break;
    case 'secondGfcfHasApproved':
      template = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Point9</title>
    </head>
    
    <body>
        <section id="containt" style="background-color: #deeaf6;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user">All</span>,</p>          
                <p style="font-size: 0.95rem;">The GFCF approval request for Bot ID <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span> is complete.</p>             
                <p>Regards,<br/>Automation Factory</p>
            </div>       
        </section>
    
        <script>
                document.getElementById("user").innerHTML = "User";
                document.getElementById("botId").innerHTML = "Bot Id";
                document.getElementById("prcoessName").innerHTML = "Prcoess Name";
        </script>
    </body>
    </html>`;
      break;
    case 'firstGfcfHasApproved':
      template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Point8</title>
      </head>
      
      <body>
          <section id="containt" style="background-color: #deeaf6;">     
              <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                  <p>Hi <span id="user">${templateData.name}</span>,</p>          
                  <p style="font-size: 0.95rem;">The First Level GFCF approval for Bot ID <span id="botId">${templateData.botExternalId}</span> with process name <span id="prcoessName">${templateData.processName}</span> is completed. Your final approval is pending.</p>  
                  <p>Link to the approval portal: <a href="${config.apporvalPortalLink}">${config.apporvalPortalLink}</a></p>             
                  <p>Regards,<br/>Automation Factory</p>
              </div>       
          </section>
      
          <script>
                  document.getElementById("user").innerHTML = "User";
                  document.getElementById("botId").innerHTML = "Bot Id";
                  document.getElementById("prcoessName").innerHTML = "Prcoess Name";
          </script>
      </body>
      </html>`;
      break;
    case 'businessOwnerHasApproved':
      template = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Point7</title>
      </head>
      
      <body>
          <section id="containt" style="background-color: #deeaf6;">     
              <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                  <p>Hi <span id="user"> ${templateData.name}</span>,</p>          
                  <p style="font-size: 0.95rem;">The process created with Bot ID <span id="botId">${templateData.botID}</span> and process name <span id="prcoessName">${templateData.processName}</span> requires your review and approval.</p>  
                  <p>Link to the approval portal: <a href="${config.apporvalPortalLink}">${config.apporvalPortalLink}</a></p>             
                  <p>Regards,<br/>Automation Factory</p>
              </div>       
          </section>
      
          <script>
                  document.getElementById("user").innerHTML = "User";
                  document.getElementById("botId").innerHTML = "Bot Id";
                  document.getElementById("prcoessName").innerHTML = "Prcoess Name";
          </script>
      </body>
      </html>`;
      break;
    default:
      console.log('Unknown mailer Type' + mailType);
      break;
  }
  return template;
};

const firstLevelApproverTemplate = async (templateData) => {
  let approverTemp = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section id="containt" style="background-color: #8ab4df;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user"></span>All,<br/>                   
                </p>
                <p style="max-width: 30rem; font-size: 0.95rem;">The approval request for  Bot id <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span> is complete. <br>
                    <a href=${config.apporvalPortalLink}>Link to the approval portal</a></p>
                <p>
                    Regards,<br/>
                    Automation Factory
                </p>
            </div>       
        </section>
    </body>
    </html>`;
  return approverTemp;
};

/*
 const getIdeaTemPlate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${templateObject.name}</span>, <p></p>
                  Thank you for reaching out!<br/>
              </p>
              <p style="max-width: 30rem; font-size: 0.95rem;">We have received your idea for 
                  automation of process <span id="ProcessToBeAutomated">${templateObject.ideaData.processToBeAutomated}</span>, 
                  application involved are <span id="ApplicationInvolved">${templateObject.ideaData.applicationInvolved}</span>
                   with description <span id="DescribeTheProcess">${templateObject.ideaData.describeTheProcess}</span> and expected benefits 
                   <span id="ExpectedBenefits">${templateObject.ideaData.expectedBenfit}</span>. </p>                           
              <p>We will get in touch with you shortly.  </p>
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};
*/

const getIdeaTemPlate = async (templateObject) => {
  let attachedFileName = path.basename(`${templateObject.ideaData.expectedPDDdocument}`);
  const userEmailName = (templateObject.name).split(' ');
  const capitalizedWords = userEmailName.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  );
  const capitalizedString = capitalizedWords.join(' ');
  console.log('attachedFileName',attachedFileName);
  console.log('templateObject>>>>',templateObject);
  console.log('templateObject>>>>',templateObject.name);
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${capitalizedString}</span>, <p></p>
                  Thank you for reaching out!<br/>
              </p>
              <p style="max-width: 30rem; font-size: 0.95rem;">We have received your idea for automation ${templateObject.ideaData.processToBeAutomated != '' ?
                  `of process <span id="ProcessToBeAutomated">${templateObject.ideaData.processToBeAutomated}</span>,`:''} ${templateObject.ideaData.applicationInvolved != '' ? `application involved are <span id="ApplicationInvolved">${templateObject.ideaData.applicationInvolved}</span>`:''}
                   with description <span id="DescribeTheProcess">${templateObject.ideaData.describeTheProcess}</span> and expected benefits 
                   <span id="ExpectedBenefits">${templateObject.ideaData.expectedBenfit}</span>.</p>  
                   <p style="max-width: 30rem; font-size: 0.95rem;">
                   <span style="font-weight: bold;">Additional Details</span>: <br/>
                   <span style="font-weight: bold;">Request Type</span>: <span id="ExpectedRequestType">${templateObject.ideaData.expectedRequestType}</span> <br/>
                   ${templateObject.ideaData.expectedProcessBotID != '' ? `<span style="font-weight: bold;">Process BOT ID</span>: <span id="ExpectedProcessBotID">${templateObject.ideaData.expectedProcessBotID}</span><br/>`:''}
		   <span style="font-weight: bold;">Cluster</span>: <span id="expectedCluster">${templateObject.ideaData.expectedCluster}</span> <br/>
                   <span style="font-weight: bold;">MCO</span>: <span id="expectedMcoType">${
                  templateObject.ideaData.expectedMcoType}</span> <br/>
                   <span style="font-weight: bold;">Lead PlatForm</span>: <span id="expectedLeadPlatform">${templateObject.ideaData.expectedLeadPlatform}</span> <br/>
                   <span style="font-weight: bold;">Area</span>: <span id="expectedAreaType">${templateObject.ideaData.expectedAreaType}</span> <br/>
                   <span style="font-weight: bold;">Requestor Email</span>: <span id="ExpectedProcessBotID">${templateObject.ideaData.expectedRequestorEmail}</span>
                   </p>
                   ${templateObject.ideaData.expectedPDDdocument !='' ? `<p style="max-width: 30rem; font-size: 0.95rem;"> <span style="font-weight: bold;">The Updated PDD Attachment</span> - ${attachedFileName}.  
                  </p>`:''}                           
              <p>We will get in touch with you shortly.  </p>
              <p>
                  Regards,<br/>
                  Hyper Automation Platform
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

//checkoutMailer

const CheckoutMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Dear <span id="user">${templateObject.name}</span>, <p></p>
              <p style="font-size: 0.95rem;"><b> You have added total: </b> <span id="Total Skills">${templateObject.checkoutData.totalSkills} skills</span> 
<br><span id ="functionSkills"><b>Functional Skills: </b> ${templateObject.checkoutData.functionSkills}</span>
<br><span id ="softSkills"><b>Soft Skills: </b> ${templateObject.checkoutData.softSkills}</span>
<br><span id ="softSkills"><b>Total Price: </b> ${templateObject.checkoutData.totalPrice}</span>
              <br>For more information, please reach out to Hyper automation at @ML_SA_IND_ET_Support
              </p>        
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};
const CheckoutMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;

  let toList = ["Abhishek.U@unilever.com", "madhurima.jaggi@unilever.com", "Gopikrishna.M@unilever.com"];
  toList.push(email)

;
  let ccList = ["binay.kumar@unilever.com"];
  ccList.push(config.sendGridFrom);
  let templateObject = {
    name: name,
    checkoutData: mailData.checkoutData,
    
  };

  let temp = await CheckoutMailTemplate(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(toList, config.sendGridFrom, ccList, 'Checkout Mail', temp);
  mailResponse = await sendMailSg(msg);
  // create to anc cc
  return true;
  // create message

  // send mail
};

const createBotMailer = async (templateData) => {
  let approverTemplate = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section id="containt" style="background-color: #8ab4df;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user"></span>All,<br/>                   
                </p>
                <p style="font-size: 0.95rem;">There is an approval request pending for Bot id <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span>.
                <br/>
                <p>Link to the approval portal: <a href=${config.apporvalPortalLink}>${config.apporvalPortalLink}</a>
                </p>
                </p>
                <p>
                    Regards,<br/>
                    Automation Factory
                </p>
            </div>       
        </section>
    </body>
    </html>`;
  return approverTemplate;
};

const businessOwnerMailer = async (templateData) => {
  let approverTemplate = `<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <section id="containt" style="background-color: #8ab4df;">     
            <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                <p>Hi <span id="user"></span>${templateData.toName ? templateData.toName : 'User'},
                <br/>                   
                </p>
                <p>The process created with Bot ID ${templateData.botID} and process name ${
    templateData.processName
  } requires your review and approval.
                <p/>
                <br/>
                <p>Link to the approval portal: <a href=${config.apporvalPortalLink}>${
    config.apporvalPortalLink
  }</a>
                </p>
                </p>
                <p>
                    Regards,<br/>
                    Automation Factory
                </p>
            </div>       
        </section>
    </body>
    </html>`;
  return approverTemplate;
};

/*
const submitAnIdeaMailer = async (mailData) => {
  console.log('mail data submit an idea ---', mailData);
  //get user email
  let { email, name } = mailData.userData;

  let toList = [];
  toList.push(email);
  let ccList = [];
  ccList.push(config.ccSendGrid);
  let templateObject = {
    name: name,
    ideaData: mailData.ideaData,
  };
  console.log('template object', templateObject);

  let ideaTemplate = await getIdeaTemPlate(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(
    toList,
    config.sendGridFrom,
    ccList,
    'Automation Idea',
    ideaTemplate
  );
  mailResponse = await sendMailSg(msg);
  // console.log('mail response ---', mailResponse);
  // create to anc cc
  return true;
  // create message

  // send mail
};
*/

const submitAnIdeaMailer = async (mailData) => {
  console.log('mail data submit an idea ---', mailData);
  // Code start for get El Mail 
  const findEngagementLead = await Submitanideael.findAll({
    attributes: ['el'],
    where: {
      [Op.and]: [
        { leadPlatform: mailData.ideaData.expectedLeadPlatform },
        { cluster: mailData.ideaData.expectedCluster },
      ],
    },
  });
  console.log('findEngagementLead', findEngagementLead);
  const getElmail = findEngagementLead[0].dataValues.el;
  const getElmailArray = getElmail.split(',');
  console.log('getElmail', getElmail);
  console.log('getElmailArray', getElmailArray);
  // Code end for get El Mail 

  //get user email
  let { email, name } = mailData.userData;
  email.toString();
  let email1 = mailData.ideaData.expectedRequestorEmail;
  email1.toString();
  console.log('email',email);
  console.log('email1',email1);
  console.log('mailData.userData',mailData.userData);
  var toList = [email];
  if((email1 != email)){
    toList.push(email1);
  }
 
  // Code for checking El mail available or not
  const unileverEmails = getElmailArray.filter(email => email.endsWith('@unilever.com'));
  console.log('unileverEmails',unileverEmails);
    // Pushing elements from getElmailArray into toList
    if(unileverEmails.length != 0){
      for (const email of unileverEmails) {
        toList.push(email);
      }
    }

  let ccList = [email];
  // ccList.push(config.ccSendGrid);
  let templateObject = {
    name: name,
    ideaData: mailData.ideaData,
  };
  console.log('template object', templateObject);

  let ideaTemplate = await getIdeaTemPlate(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);
  // Create a new Set to eliminate duplicates
  const uniqueEmailSet = new Set(toList);
  // Convert the Set back to an array
  var toListEmailArray = Array.from(uniqueEmailSet);
  console.log('toListEmailArray',toListEmailArray);
  
  // Create the attachment object
  const path = require('path');
  const url = `${mailData.ideaData.expectedPDDdocument}`;
  var expectedPDDDocFile = `${mailData.ideaData.expectedDocUpdated}`;
  console.log('expectedPDDDocFile',expectedPDDDocFile);

  if(expectedPDDDocFile == 'Yes'){
  axios
  .get(url, { responseType: 'arraybuffer' })
  .then((response) => {
    let docFileName = path.basename(url);
    console.log('docFileName',docFileName);
    console.log('url',url);
    const attachment = {
      content: Buffer.from(response.data).toString('base64'),
      filename: docFileName,
      type: '*/*',
      disposition: 'attachment',
    };
  const email1 = {
    to:toListEmailArray,
    from: "botstore@unilever.com",
    subject: "Automation Idea",
    text: "Submit an Idea",
    html: ideaTemplate,
    attachments: [attachment]
  };
   sendMailSg(email1)
   })
  }

 if(expectedPDDDocFile == 'No'){
   const email2 = {
    to:toListEmailArray,
    from: "botstore@unilever.com",
    subject: "Automation Idea",
    text: "Submit an Idea",
    html: ideaTemplate
   };
   sendMailSg(email2)
 }

  // create template
  /*let msg = await createMessage(
    toList,
    config.sendGridFrom,
    ccList,
    'Automation Idea',
    ideaTemplate
  );
  mailResponse = await sendMailSg(msg);
  // console.log('mail response ---', mailResponse);
  // create to anc cc
  return true;
  // create message

  // send mail*/
};

const costControlMail = async (mailData) => {
  console.log('feedback--->>>>>>>>>>', mailData);
  //get user email
  let { email, name } = mailData.user;
  console.log('line 1920', email, name);

  let toList = [];
  toList.push(email);
  let ccList = [];
  // ccList.push(config.sendGridFrom);
  console.log('line 1927', ccList);
  let templateObject = {
    name: name,
    emailData: mailData.emailData,
    monthName:mailData.monthName,
    totalRunCost:mailData.totalRunCost,
    selectedYear:mailData.selectedYear,
  };
  console.log('template object lone 2002', templateObject);

  let feedbackTemp = await costControlTemplet(templateObject);
  console.log('>>>>>>>>>>>>>1933<<<<<<', feedbackTemp);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(
    toList,
    config.sendGridFrom,
    ccList,
    `Run Cost Details - ${mailData.emailData[0].businessApprover} for ${mailData.monthName}_${mailData.selectedYear}`,
    feedbackTemp
  );
  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  // create to anc cc
  return true;
  // create message

  // send mail
};

const costControlTemplet = async (templateObject)=>{
  const userEmailName = templateObject.name.split(' ');
  const capitalizedWords = userEmailName.map(
    (word) => word.charAt(0).toUpperCase() + word.slice(1)
  );
  const capitalizedString = capitalizedWords.join(' ');
  console.log('templateObject>>>> line 2032', templateObject);
  console.log('templateObject>>>> line 2033', templateObject.emailData[0].businessApprover);
  console.log('templateObject.totalRunCost', templateObject.totalRunCost);
  let formTable = `
    <table style="border-collapse: collapse; width: 80%;">
      <tr>
        <th style="border: 1px solid #deeaf6; padding: 8px; text-align:left;">Requirement</th>
        <th style="border: 1px solid #deeaf6; padding: 8px; text-align:left;">Comment</th>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;">ET Name</td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].businessApprover}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Month Of Billing</td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.monthName}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Business Approver</td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${capitalizedString}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Cost Center </td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].costCenter}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> To Cost Center </td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].toCostCenter}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Gl Account</td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].glAccount}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> To Company Code</td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].toCompanyCode}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Country Code </td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.emailData[0].countryCode}</td>
      </tr>
      <tr>
        <td style="border: 1px solid #deeaf6; padding: 8px;"> Total Run-Cost </td>
        <td style="border: 1px solid #deeaf6; padding: 8px;">${templateObject.totalRunCost}</td>
      </tr>
    </table>
  `;
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: transparent;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p style="max-width: 30rem; font-size: 0.95rem;">Dear Finance Team, </p>
              <p style="max-width: 30rem; font-size: 0.95rem;">PFA the details of Monthly run-cost for <span style="font-weight:bold;">${templateObject.emailData[0].businessApprover}</span> for the month of  <span style="font-weight:bold;">${templateObject.monthName}</span> </p>
              <p style="max-width: 30rem; font-size: 0.95rem;">${formTable}</p>
                                             
              <p>We will get in touch with you shortly.  </p>
              <p>
                  Regards,<br/>
                  Hyper Automation Platform
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
}

var getUserNameFromEmail = async (email) => {
  console.log('Fetching User Name' + email);
  let fetchUser = await UserBot.User.findAll({
    attributes: ['name'],
    where: {
      email: email,
    },
  });
  console.log('User Found' + JSON.stringify(fetchUser));
  var name = fetchUser[0].name;
  if (!_.isEmpty(name)) {
    console.log('Returning Name' + name);
    return name;
  } else {
    return email;
  }
};

const updateBotMailer = async (mailData) => {
//vvvvvv  var ccList = [];
//vvvvvv  let toList = [];
  let templateData = {};
  var emailTemplate = '';
  var msg = '';
  let { email, name } = mailData.userData;
  let {
    engagementLead,
    businessOwnerEmailID,
    UserEmail, // creator of bot
    cluster,
    mco,
    kfa,
    area,
    leadPlatform,
    subArea,
    botID,
    processName,
    botExternalId,
  } = mailData.botData;
  // console.log('mailData' + JSON.stringify(mailData));
  var userType = _.get(mailData, ['userData', 'userType']);
  console.log(' DDDDDDDDuserType found' + userType);
  switch (userType) {
    case 'firstLevelGPMApprover':
      console.log('Approved By ' + userType);
      // TO: Second Level Approver GPM
      let gpmMialerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          leadPlatform: leadPlatform,
          area: area,
          subArea: subArea,
          [Op.or]: [{ userType: 'GPMapprover' }],
        },
      });

      gpmMialerList.map(async (gpm, i) => {
        if (!toList.includes(gpm.dataValues.email)) {
          toList.push(gpm.dataValues.email);
        }
      });
      // CC: First Level Approver GPM
      var firstLevelGpmApproverList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          leadPlatform: leadPlatform,
          area: area,
          subArea: subArea,
          [Op.or]: [{ userType: 'firstLevelGPMApprover' }],
        },
      });

      firstLevelGpmApproverList.map(async (gpm, i) => {
        if (!ccList.includes(gpm.dataValues.email)) {
          ccList.push(gpm.dataValues.email);
        }
      });

      // CC: Engagement Lead of the process
      ccList.push(engagementLead);
      // CC: Bot Creator Email ID
      ccList.push(UserEmail);
      // CC: Process Owner of the Process
      ccList.push(businessOwnerEmailID);
      // CC: Admin User Group Email ID's
      var adminList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          userType: 'admin',
        },
      });
      adminList.map(async (admin, i) => {
        if (!ccList.includes(admin.dataValues.email)) {
          ccList.push(admin.dataValues.email);
        }
      });
      // CC: automation.factory@unilever.com
      // ccList.push('automation.factory@unilever.com');
      var toName = await getUserNameFromEmail(toList[0]);
      toName = !_.isEmpty(toName) ? toName : toList[0];
      _.set(templateData, ['botID'], botID);
      _.set(templateData, ['processName'], processName);
      _.set(templateData, ['toName'], toName);
      _.set(templateData, ['botExternalId'], botExternalId)
      console.log(templateData);
      emailTemplate = getMailerTemplate('firstLevelGpmHasApproved', templateData);
      msg = await createMessage(
   //vvvv     toList,
     //vvvvv   config.sendGridFrom,
        ccList,
        'Final GPM Approval - [' + botExternalId + ']',
        emailTemplate
      );
      // ccList.push(config.ccSendGrid);

      mailResponse = await sendMailSg(msg);
      break;
    case 'GPMapprover':
      // TO: Bot Creator Email ID
      toList.push(UserEmail);
      // TO: Process Owner of the Process
      toList.push(businessOwnerEmailID);
      // CC: Engagement Lead of the process
      ccList.push(engagementLead);
      // CC: First Level Approver GPM
      var firstLevelGpmApproverList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          leadPlatform: leadPlatform,
          area: area,
          subArea: subArea,
          [Op.or]: [{ userType: 'firstLevelGPMApprover' }],
        },
      });
      firstLevelGpmApproverList.map(async (gpm, i) => {
        if (!ccList.includes(gpm.dataValues.email)) {
          ccList.push(gpm.dataValues.email);
        }
      });
      // CC: Second Level Approver GPM
      gpmMialerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          leadPlatform: leadPlatform,
          area: area,
          subArea: subArea,
          [Op.or]: [{ userType: 'GPMapprover' }],
        },
      });

      gpmMialerList.map(async (gpm, i) => {
        if (!ccList.includes(gpm.dataValues.email)) {
          ccList.push(gpm.dataValues.email);
        }
      });
      // CC: Admin User Group Email ID's
      var adminList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          userType: 'admin',
        },
      });
      adminList.map(async (admin, i) => {
        if (!ccList.includes(admin.dataValues.email)) {
          ccList.push(admin.dataValues.email);
        }
      });
      // CC: automation.factory@unilever.com
      // ccList.push('automation.factory@unilever.com');
      _.set(templateData, ['botID'], botID);
      _.set(templateData, ['processName'], processName);
      emailTemplate = getMailerTemplate('secondLevelGpmHasApproved', templateData);
      // ccList.push(config.ccSendGrid);
      // ccList.push(config.ccSendGrid);
      msg = await createMessage(
        toList,
        config.sendGridFrom,
        ccList,
        '[' + botID + '] - GPM Review Complete',
        emailTemplate
      );

      mailResponse = await sendMailSg(msg);
      break;
    case 'gfcf':
      // TO: Bot Creator Email ID
      toList.push(UserEmail);
      // TO: Process Owner of the Process
      toList.push(businessOwnerEmailID);
      // CC: Engagement Lead of the process
      ccList.push(engagementLead);
      // CC: First Level Approver GFCF
      let gfcfMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          cluster: cluster,
          mco: mco,
          [Op.or]: [{ userType: 'firstGfcf' }],
        },
        UserEmail,
      });

      gfcfMailerList.map(async (gfcf, i) => {
        console.log('gfcfMailer List', gfcf.dataValues.email);
        if (!ccList.includes(gfcf.dataValues.email)) {
          ccList.push(gfcf.dataValues.email);
        }
      });
      // CC: Second Level Approver GFCF
      gfcfMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          cluster: cluster,
          mco: mco,
          [Op.or]: [{ userType: 'gfcf' }],
        },
        UserEmail,
      });

      gfcfMailerList.map(async (gfcf, i) => {
        console.log('gfcfMailer List', gfcf.dataValues.email);
        if (!ccList.includes(gfcf.dataValues.email)) {
          ccList.push(gfcf.dataValues.email);
        }
      });
      // CC: Admin User Group Email ID's
      var adminList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          userType: 'admin',
        },
      });
      adminList.map(async (admin, i) => {
        if (!ccList.includes(admin.dataValues.email)) {
          ccList.push(admin.dataValues.email);
        }
      });
      // CC: automation.factory@unilever.com
      // ccList.push('automation.factory@unilever.com');
      // ccList.push(config.ccSendGrid);
      _.set(templateData, ['botID'], botID);
      _.set(templateData, ['processName'], processName);
      emailTemplate = getMailerTemplate('secondGfcfHasApproved', templateData);
      var controlDetails = [];
      var firstLevelControlTable = _.get(mailData, ['botData', 'firstLevelControlTable'], []);
      controlDetails = !_.isEmpty(firstLevelControlTable)
        ? controlDetails.concat(JSON.parse(firstLevelControlTable))
        : controlDetails;

      console.log('Control detailssss', controlDetails);
      var controlDetailsTable = [];
      controlDetails.forEach((controlDetail, i) => {
        controlDetailsTable.push(
          `<tr><td style="padding-left: 0.5rem; width: 1.5rem; color: #73706e">
     ${i + 1}
     </td>
     <td style="padding-left: 0rem">
     <div style="background-color: #f4f4f4; padding-left: 1rem; width: 95%">
     <p style="margin: 0; color: #73706e; line-height : 1.5rem;" >Control Number :</p>
     <h6 style="margin-bottom: 1rem">
      ${controlDetail.control}
     </h6>
     <p style="margin: 0; color: #73706e; line-height : 1.5rem;" >Control Name :</p>
     <h6 style="margin-bottom: 1rem">
            ${controlDetail.controlName} 
     </h6>
     <p style="margin: 0; color: #73706e; line-height : 1.5rem">Control Description :</p>
     <h6 style="max-width: 90%; margin-bottom: 1rem">
            ${controlDetail.controlDescription} 
     </h6>
    
     <p style="margin: 0; color: #73706e; line-height : 1.5rem">Mitigation :</p>
     <h6 style="padding-bottom: 1rem">
            ${controlDetail.mitigationComment} 
     </h6>
     </div>
     </td>
     </tr>`
        );
      });

      var data = {
        approver: _.get(mailData, ['userData', 'name'], ''),
        botId: _.get(mailData, ['botData', 'botID'], ''),
        processName: _.get(mailData, ['botData', 'processName'], ''),
        leadPlatform: _.get(mailData, ['botData', 'leadPlatform'], ''),
        area: _.get(mailData, ['botData', 'area'], ''),
        subArea: _.get(mailData, ['botData', 'subArea'], ''),
        processDescription: _.get(mailData, ['botData', 'processDescription'], ''),
        controlActivity: _.get(mailData, ['botData', 'firstLevelControlActivity'], '')
          ? 'Yes'
          : 'No',
        informationControl: _.get(mailData, ['botData', 'kfaIuc'], '')
          ? 'Yes'
          : _.get(mailData, ['botData', 'kfaIuc'], '') === false
          ? 'No'
          : '',
        processArea: _.get(mailData, ['botData', 'firstLevelControlProcessArea'], ''),
        subProcessArea: _.get(mailData, ['botData', 'firstLevelControlSubProcessArea'], ''),
        controlDetails: controlDetails,
        comments: _.get(mailData, ['botData', 'secondLevelGfcfComment'], ''),
        status: _.get(mailData, ['botData', 'status'], '')
          ? 'Approved'
          : _.get(mailData, ['botData', 'status'], '') === false
          ? 'Rejected'
          : '',
        documentLink: _.get(mailData, ['botData', 'secondLevelGfcfApprovalDocumentLink'], ''),
      };
      var timestamp = moment().format();
      var chosenTemplate;
      if (!_.get(mailData, ['botData', 'firstLevelControlActivity'], false)) {
        chosenTemplate = pdfMailerTemplateV1;
      } else {
        chosenTemplate = pdfMailerTemplateV2;
        var indexedControlDetails = [];
        data.controlDetails.forEach((cd, i) => {
          _.set(cd, 'index', i + 1);
          indexedControlDetails.push(cd);
        });
        _.set(data, 'controlDetails', indexedControlDetails);
        _.set(data, 'controlDetailsLength', indexedControlDetails.length);
      }
      await htmlToPdf(chosenTemplate, data, 'GFCF Approval' + data.botId)
        .then(async (fromResolve) => {
          console.log('Received resolve from htmlToPdf' + JSON.stringify(fromResolve));
          var msg = await createMessage(
         //vvvvvv   toList,
        //vvvvvv    config.sendGridFrom,
        //vvvvvv    ccList,
            '[' + botID + '] - GFCF Review Complete',
            emailTemplate,
            'GFCF Approval' + data.botId + '.pdf',
            data.botId,
            timestamp
          );
          mailResponse = await sendMailSg(msg);
          fs.unlinkSync('./tempFiles/GFCF Approval' + data.botId + '.pdf', function () {
            console.log('File deleted successfully after email');
          });
        })
        .catch((fromReject) => {
          console.log('fromReject html to pdf' + fromReject);
        });
      break;
    case 'firstGfcf':
      // TO: Second Level Approver GFCF
      gfcfMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          cluster: cluster,
          mco: mco,
          [Op.or]: [{ userType: 'gfcf' }],
        },
        UserEmail,
      });

      gfcfMailerList.map(async (gfcf, i) => {
        console.log('gfcfMailer List', gfcf.dataValues.email);
        if (!toList.includes(gfcf.dataValues.email)) {
          toList.push(gfcf.dataValues.email);
        }
      });
      // CC: First Level Approver GFCF
      gfcfMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          cluster: cluster,
          mco: mco,
          [Op.or]: [{ userType: 'firstGfcf' }],
        },
        UserEmail,
      });

      gfcfMailerList.map(async (gfcf, i) => {
        console.log('gfcfMailer List', gfcf.dataValues.email);
        if (!ccList.includes(gfcf.dataValues.email)) {
          ccList.push(gfcf.dataValues.email);
        }
      });
      // CC: Engagement Lead of the process
      ccList.push(engagementLead);
      // CC: Bot Creator Email ID
      ccList.push(UserEmail);
      // CC: Process Owner of the Process
      ccList.push(businessOwnerEmailID);
      // CC: Admin User Group Email ID's
      var adminList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          userType: 'admin',
        },
      });
      adminList.map(async (admin, i) => {
        if (!ccList.includes(admin.dataValues.email)) {
          ccList.push(admin.dataValues.email);
        }
      });
      // CC: automation.factory@unilever.com
      // ccList.push('automation.factory@unilever.com');
      // ccList.push(config.ccSendGrid);
      var toName = await getUserNameFromEmail(toList[0]);
      toName = !_.isEmpty(toName) ? toName : toList[0];
      _.set(templateData, ['botID'], botID);
      _.set(templateData, ['processName'], processName);
      _.set(templateData, ['name'], toName);
      _.set(templateData, ['botExternalId'], botExternalId)
      emailTemplate = getMailerTemplate('firstGfcfHasApproved', templateData);
      msg = await createMessage(
        toList,
     //vvvvvv   config.sendGridFrom,
        ccList,
        'Final GFCF Approval - [' + botExternalId + ']',
        emailTemplate
      );
      mailResponse = await sendMailSg(msg);
      break;
    case 'businessOwner':
      // TO: First Level GFCF Approver / Second Level GFCF Approver if First Level GFCF is not available
      if (kfa) {
        gfcfMailerList = await UserBot.User.findAll({
          attributes: ['email'],
          where: {
            cluster: cluster,
            mco: mco,
            [Op.or]: [{ userType: 'firstGfcf' }],
          },
          UserEmail,
        });

        gfcfMailerList.map(async (gfcf, i) => {
          console.log('gfcfMailer List', gfcf.dataValues.email);
          if (!toList.includes(gfcf.dataValues.email)) {
            toList.push(gfcf.dataValues.email);
          }
        });
        if (_.isEmpty(toList)) {
          let gfcfMailerList = await UserBot.User.findAll({
            attributes: ['email'],
            where: {
              cluster: cluster,
              mco: mco,
              [Op.or]: [{ userType: 'gfcf' }],
            },
            UserEmail,
          });

          gfcfMailerList.map(async (gfcf, i) => {
            console.log('gfcfMailer List', gfcf.dataValues.email);
            if (!toList.includes(gfcf.dataValues.email)) {
              toList.push(gfcf.dataValues.email);
            }
          });
        }
        // CC: Engagement Lead of the process
        ccList.push(engagementLead);
        // CC: Bot Creator Email ID
        ccList.push(UserEmail);
        // CC: Process Owner of the Process
        ccList.push(businessOwnerEmailID);
        // CC: Admin User Group Email ID's
        var adminList = await UserBot.User.findAll({
          attributes: ['email'],
          where: {
            userType: 'admin',
          },
        });
        adminList.map(async (admin, i) => {
          if (!ccList.includes(admin.dataValues.email)) {
            ccList.push(admin.dataValues.email);
          }
        });
        // CC: automation.factory@unilever.com
        ccList.push('automation.factory@unilever.com');
        var toName = await getUserNameFromEmail(toList[0]);
        toName = !_.isEmpty(toName) ? toName : toList[0];
        _.set(templateData, ['botID'], botID);
        _.set(templateData, ['processName'], processName);
        _.set(templateData, ['name'], toName);
        emailTemplate = getMailerTemplate('businessOwnerHasApproved', templateData);
        msg = await createMessage(
          toList,
          config.sendGridFrom,
          ccList,
          'GFCF Approval - [' + botID + ']',
          emailTemplate
        );
        // ccList.push(config.ccSendGrid);

        mailResponse = await sendMailSg(msg);
      }
      break;
    default:
      console.log('Invalid User Type ' + userType);
      break;
  }
};

const createApproveBotMailer = async (mailData) => {
//vvvvvv  let ccList = [];
//vvvvvv  let toList = [];
  let templateData = {};

  console.log('Mail data  ---', mailData);

  let { email, name } = mailData.userData;
  templateData.name = name;
  console.log('Bot Creator email ', email);

  if (mailData.type == 'CreateBot') {
    templateData.type = 'approverTemplate';
    let {
      kfa,
      area,
      cluster,
      mco,
      engagementLead,
      businessOwnerEmailID,
      leadPlatform,
      subArea,
      botID,
      botExternalId,
      processName,
    } = mailData.botData;
    templateData.botID = botExternalId;
    templateData.processName = processName;
    let { email } = mailData.userData;
    // cc -----el----------------- userEmail -- admin
    ccList.push(engagementLead);
    // ccList.push(businessOwnerEmailID);
    ccList.push(email);
    // toList.push(businessOwnerEmailID);
    if (businessOwnerEmailID && businessOwnerEmailID.includes('@unilever.com')) {
      toList.push(businessOwnerEmailID);
    }
   // console.log('cc list ', ccList);
    console.log(
      kfa,
      area,
      cluster,
      mco,
      engagementLead,
      businessOwnerEmailID,
      leadPlatform,
      subArea
    );
    // find email id with cluster and mco
    if (kfa) {
      let gfcfMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          cluster: cluster,
          mco: mco,
          [Op.or]: [{ userType: 'firstGfcf' } /*, { userType: 'gfcf' }*/],
        },
      });
      console.log('gfcfMailer List', gfcfMailerList);
      if (gfcfMailerList.length === 0) {
        let gfcfL2MailerList = await UserBot.User.findAll({
          attributes: ['email'],
          where: {
            cluster: cluster,
            mco: mco,
            [Op.or]: [{ userType: 'gfcf' }],
          },
        });
        for (let i = 0; i < gfcfL2MailerList.length; i++) {
          if (gfcfL2MailerList[i].dataValues.email != email) {
            console.log(gfcfL2MailerList[i].dataValues.email);
            toList.push(gfcfL2MailerList[i].dataValues.email);
          }
        }
      } else {
        for (let i = 0; i < gfcfMailerList.length; i++) {
          if (gfcfMailerList[i].dataValues.email != email) {
            console.log(gfcfMailerList[i].dataValues.email);
            toList.push(gfcfMailerList[i].dataValues.email);
          }
        }
      }
    }

    if (cluster == 'Global') {
      let gcadMailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          [Op.or]: [{ userType: 'gCad' }],
        },
      });
      console.log('gcadMailerList List', gcadMailerList);

      for (let i = 0; i < gcadMailerList.length; i++) {
        if (gcadMailerList[i].dataValues.email != email) {
          console.log(gcadMailerList[i].dataValues.email);
          toList.push(gcadMailerList[i].dataValues.email);
        }
      }
    }
    // generate gpm approver list
    let gpmMialerList = await UserBot.User.findAll({
      attributes: ['email'],
      where: {
        leadPlatform: leadPlatform,
        area: area,
        subArea: subArea,
        [Op.or]: [/*{ userType: 'GPMapprover' }, */ { userType: 'firstLevelGPMApprover' }],
      },
    });

    if (gpmMialerList.length === 0) {
      let gpmL2MailerList = await UserBot.User.findAll({
        attributes: ['email'],
        where: {
          leadPlatform: leadPlatform,
          area: area,
          subArea: subArea,
          [Op.or]: [{ userType: 'GPMapprover' }],
        },
      });
      for (let i = 0; i < gpmL2MailerList.length; i++) {
        if (gpmL2MailerList[i].dataValues.email != email) {
          console.log(gpmL2MailerList[i].dataValues.email);
          toList.push(gpmL2MailerList[i].dataValues.email);
        }
      }
    } else {
      console.log('gfcfMailer List----', gpmMialerList);
      for (let i = 0; i < gpmMialerList.length; i++) {
        if (gpmMialerList[i].dataValues.email != email) {
          console.log(gpmMialerList[i].dataValues.email);
          toList.push(gpmMialerList[i].dataValues.email);
        }
      }
    }

    // update to list
    let adminList = await UserBot.User.findAll({
      attributes: ['email'],
      where: {
        userType: 'admin',
      },
    });

    for (let i = 0; i < adminList.length; i++) {
      if (adminList[i].dataValues.email != email) {
        console.log(adminList[i].dataValues.email);
        ccList.push(adminList[i].dataValues.email);
      }
    }
   // console.log('cc list', ccList);
  //  console.log('to list ---', toList);
  }

  var businessOwnerEmail = _.get(mailData, ['botData', 'businessOwnerEmailID'], '');
  let user = await UserBot.User.findAll({
    attributes: ['name'],
    where: {
      email: businessOwnerEmail,
    },
  });

  if (!_.isEmpty(user.name)) {
    templateData.name = user.name;
  } else {
    templateData.name = businessOwnerEmail;
  }

  // create template
  console.log(templateData);
  var getTempl = await createBotMailer(templateData);
  console.log('resp template--', getTempl);
  // create message // comment this line in production
  //ccList = ['MohitKumar.Singh@unilever.com'];
  // ccList.push(config.ccSendGrid);
  // to and cc needs to be different // comment this line in production
  //toList = ['sanjay.sharma@unilever.com'];
  let msg = await createMessage(
    toList,
 //vvvvvv   config.sendGridFrom,
 //vvvv   ccList,
    `New Bot Approval - ${templateData.botID}`,
    getTempl
  );
 //vvvv console.log('Sending create bot email' + JSON.stringify(msg));
  mailResponse = await sendMailSg(msg);
//vvvvv  console.log('mail response ---', mailResponse);
  // send mail
  return true;
};

////devops mailer template
const createDevopsmailer=async (templateData)=>{
  let errorApiTemplate = `<html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
      </head>
      <body>
          <section id="containt" style="background-color: #8ab4df;">     
              <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500;">
                  <p>Hi ${templateData.createdBy},<br/>                   
                  </p>
                  <p style="font-size: 0.95rem;"> A new bot entry with Bot ID  <span id="botId">${templateData.botExternalId}</span> <br> Process Name: <span id="prcoessName">${templateData.processName}</span><br>Request Type:<span id="requestType">${templateData.requestType}</span><br>engagementLead :<span id="engagementLead">${templateData.engagementLead}</span><br>cluster:<span id="cluster">${templateData.cluster}</span><br>Country :<span id="Country">${templateData.country}</span><br>mco :<span id="mco">${templateData.mco}</span><br>status :<span id="status">${templateData.status}</span><br> leadPlatform :<span id="leadPlatform">${templateData.leadPlatform}</span><br> technology :<span id="technology">${templateData.technology}</span></span><br> kfa :<span id="kfa">${templateData.kfa}</span> <br><span> is created in Automation Portal</span>.
                  <br/>
                  
  
                 
                  </p>
                  </p>
  
                  <p>
                  <p style="max-width: 30rem; font-size: 0.95rem;">Please reach out the botstore page .</p>
  
                      Regards,<br/>
                      Automation Factory
                  </p>
              </div>       
          </section>
      </body>
      </html>`;
    return errorApiTemplate;
  };
  
  
  
  
  
  //devops api error handling
  
  const devopsMailer= async (mailData)=>{
 //vvvvvv   let ccList = [];
 //vvvvvv   let toList = ["ulaf.support@mindtree.com"];
    let templateData={};
  
    console.log('devopsApiError==',mailData)
  
  if (mailData.type=='DEVOPSAPIERROR'){
    templateData.type='errorApiTemplate';
    let {
      botID,
      processName,
      requestType,
      engagementLead,
      cluster,
      country,
      mco,
      leadPlatform,
      status,
      technology,
      kfa,
      botExternalId,
      createdBy,
    }= mailData.botData;
    templateData.botID =botID;
    templateData.processName = processName;
    templateData.engagementLead =engagementLead;
    templateData.cluster = cluster;
    templateData.country = country;
    templateData.mco = mco;
    templateData.leadPlatform= leadPlatform;
    templateData.status= status;
    templateData.technology= technology;
    templateData.kfa= kfa;
    templateData.requestType= requestType;
    templateData.botExternalId= botExternalId;
    templateData.createdBy = createdBy;
  
  
  
  }
  console.log("sdjfadsjf",templateData.engagementLead,"vineethtemplate")
  var getDevopsTemplate=await createDevopsmailer(templateData);
  console.log(getDevopsTemplate,"getDevopsTemplate==")
  
///el lead push to cclist
ccList.push(templateData.engagementLead);

  let msg = await createMessage(
    toList,
  //vvvvvv  config.sendGridFrom,
    ccList,
    `Api Failed to create New WorkItem in DEVOPS- ${templateData.botExternalId}`,
    getDevopsTemplate
  );
  console.log('sending Api error handling message', + JSON.stringify(msg))
  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  return true;
  
  }

const feedbackTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${templateObject.name}</span>, <p></p>
                Thank you so much for your amazing review! 
                We are so happy to hear that you are enjoying Automation. 
                Please let us know if we can help you with anything further, 
                and thank you for taking time out of your day to leave us this super kind review.
              </p>         
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const feedbackMail = async (mailData) => {
  console.log('feedback--->>>>>>>>>>', mailData);
  //get user email
  let { email, name } = mailData.user;
  console.log("line 1920",email,name);

  let toList = [];
  toList.push(email);
  let ccList = [];
  // ccList.push(config.sendGridFrom);
  console.log("line 1927",ccList);
  let templateObject = {
    name: name,
    feedData: mailData.feedData,
  };
  console.log('template object', templateObject);

  let feedbackTemp = await feedbackTemplate(templateObject);
  console.log(">>>>>>>>>>>>>1933<<<<<<", feedbackTemp)
//vvvvvv  console.log('to list ', toList);
//vvvvvv  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(
    toList,
   'botstore@unilever.com',
    ccList,
    'Automation Feedback',
    feedbackTemp
  );
  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  // create to anc cc
  return true;
  // create message

  // send mail
};

////random mail
const randomMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
<head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Dear<span id="user">${templateObject.name}</span>, 
              <p>
              Thank you for your interest in experiencing Employee Twin. 
              Allow us to introduce Chloe, our very own prototype digital twin. 
              Please refer to the attached installation guide to begin using Chloe.
              </p>
              <p>
              Credentials:
              <br>
              User : employeetwin2@73d62k.onmicrosoft.com
              <br>
              Password : EmployeeT@123
              </p>
              </p>
<p>
<a href="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/employeetwin/Experience%20ET%20with%20Chloe.docx">Click here to download ET Expperience Document</a>
</p>         
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const randomMail = async (mailData) => {
  console.log('randomMail--->>>>>>>>>>', mailData);
  //get user email
  let { email, name } = mailData.user;
  console.log("line 1920",email,name);

  let toList = [];
  toList.push(email);
  let ccList = [];
  ccList.push(config.sendGridFrom)
  let templateObject = {
    name: name,
    randomData: mailData.randomData,
  };
  console.log('template object', templateObject);

  let randomMailTemp = await randomMailTemplate(templateObject);
  console.log(">>>>>>>>>>>>>1933<<<<<<", randomMailTemp)
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(
    toList,
  'botstore@unilever.com',
    ccList,
    'Automation Random Mail & Password',
    randomMailTemp
  );
  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  // create to anc cc
  return true;
  // create message

  // send mail
};


///////////skill mail API/////////
{/*const DeleteSkillMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Dear <span id="user">${templateObject.name}</span>, <p></p>
 <p style="font-size: 0.95rem;">Deleted a skill: <span id="Total Skills"><b>${templateObject.deleteskillData.skillName}</b></span> 
              <br><span id ="skilltype">Skill Type: <b>${templateObject.deleteskillData.skilltype}</b></span>
              <br><span id ="RunCostPerHit_Hour">Total No. of Hits <b>${templateObject.deleteskillData.RunCostPerHit_Hour}</b></span>
              <br><span id ="email">and it is deleted by <b>${templateObject.deleteskillData.email}</b></span>               
              <br>For more information, please reach out to Hyper automation at @ML_SA_IND_ET_Support
              </p>                  
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};*/}
const DeleteSkillMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${templateObject.name}</span>, <p></p>
              <p style="font-size: 0.95rem;"> You just deleted <span id="Total Skills">${templateObject.deleteskillData.skillName} to ${templateObject.deleteskillData.empid}. The skill will be removed from ${templateObject.deleteskillData.empid} immediately. </span> 
              
             </p>        
              <p>
                  Regards,<br/>
                  <img src="https://automation.unilever.com/sites/default/files/2023-04/HAP_Logo_White_Transparent_BG_Horizontal_SVG.png"
 style="background-color:#1f36c7;height:auto;width:40%"/>
                  <br>
                  <p>Automation.Factory@unilever.com</p><br>
                  <a href="https://automation.unilever.com/">https://automation.unilever.com/</a>
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};
const DeleteSkillMailTemplate1 = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi HAP team <br>
              <span id="user">${templateObject.name}</span>, just deleted <span id="Total Skills">${templateObject.deleteskillData.skillName} from ${templateObject.deleteskillData.empid}. Please take action! </span> 
              
             </p>        
               <p>
                  Regards,<br/>
      <img src="https://automation.unilever.com/sites/default/files/2023-04/HAP_Logo_White_Transparent_BG_Horizontal_SVG.png"
style="background-color:#1f36c7;height:auto;width:40%"/>
                  <br>
                  <p>Automation.Factory@unilever.com</p><br>
                  <a href="https://automation.unilever.com/">https://automation.unilever.com/</a>
              </p>

              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const deleteSkillMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;

  let toList = ["Abhishek.U@unilever.com", "madhurima.jaggi@unilever.com", "Gopikrishna.M@unilever.com"];
  let toList1 = ["veshaly.varshney@unilever.com", "binay.kumar@unilever.com"]; 
 toList1.push(email)
;
  let ccList = ["Abhishek.U@unilever.com", "madhurima.jaggi@unilever.com", "Gopikrishna.M@unilever.com"];
  ccList.push(config.sendGridFrom);
  let templateObject = {
    name: name,
    deleteskillData: mailData.deleteskillData,
    
  };

  let temp = await DeleteSkillMailTemplate(templateObject);
 let temp1 = await DeleteSkillMailTemplate1(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  //let msg = await createMessage(toList, config.sendGridFrom, ccList, 'Delete Skill Mail', temp);
 let msg = await createMessage(toList1, config.sendGridFrom, ccList, `Oops! You just deleted ${templateObject.deleteskillData.skillName} from ${templateObject.deleteskillData.empid} !`, temp);
  let msg1 = await createMessage(toList, config.sendGridFrom,ccList,  `${templateObject.name} just deleted ${templateObject.deleteskillData.skillName} from ${templateObject.deleteskillData.empid}`, temp1);
    
mailResponse = await sendMailSg(msg);
mailResponse = await sendMailSg(msg1);  
// create to anc cc
  return true;
  // create message

  // send mail
};
{/*
const addSkillMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Dear <span id="user">${templateObject.name}</span>, <p></p>
               <p style="font-size: 0.95rem;">Added a skill: <span id="Total Skills"><b>${templateObject.addSkillData.skillName}</b></span> 
              <br><span id ="skilltype">Skill Type: <b>${templateObject.addSkillData.skilltype}</b></span>
              <br><span id ="RunCostPerHit_Hour">Total No. of Hits <b>${templateObject.addSkillData.RunCostPerHit_Hour}</b></span>
              <br><span id ="email">and it is added by <b>${templateObject.addSkillData.email}</b></span>               
              <br>For more information, please reach out to Hyper automation at @ML_SA_IND_ET_Support
              </p>    
              
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};*/}
const addSkillMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${templateObject.name}</span>, <p></p>
              <p style="font-size: 0.95rem;"> You just added <span id="Total Skills">${templateObject.addSkillData.skillName} to ${templateObject.addSkillData.empid}. The skill will reflect on ${templateObject.addSkillData.empid} within in a week. </span> 
              
             </p>        
              <p>
                  Regards,<br/>
                  <img src="https://automation.unilever.com/sites/default/files/2023-04/HAP_Logo_White_Transparent_BG_Horizontal_SVG.png"/>
                  <br>
                  <p>Automation.Factory@unilever.com</p><br>
                  <a href="https://automation.unilever.com/">https://automation.unilever.com/</a>
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};
const addSkillMailTemplate1 = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi HAP team <br>
              <span id="user">${templateObject.name}</span>, just added  <span id="Total Skills">${templateObject.addSkillData.skillName} to ${templateObject.addSkillData.empid}. Please take action! </span> 
              
             </p>        
              <p>
                  Regards,<br/>
                  <img src="https://automation.unilever.com/sites/default/files/2023-04/HAP_Logo_White_Transparent_BG_Horizontal_SVG.png"/>
                  <br>
                  <p>Automation.Factory@unilever.com</p><br>
                  <a href="https://automation.unilever.com/">https://automation.unilever.com/</a>
              </p>
              <p>
      
    </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const addSkillMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;
  let toList = [ "Abhishek.U@unilever.com","madhurima.jaggi@unilever.com", "Gopikrishna.M@unilever.com"];
  let toList1 = ["veshaly.varshney@unilever.com", "binay.kumar@unilever.com"];
 toList1.push(email)

;
 let ccList = ["Abhishek.U@unilever.com", "madhurima.jaggi@unilever.com", "Gopikrishna.M@unilever.com"];
  ccList.push(config.sendGridFrom);

  let templateObject = {
    name: name,
    addSkillData: mailData.addSkillData,
    
  };

  let temp = await addSkillMailTemplate(templateObject);
   let temp1 = await addSkillMailTemplate1(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
 // let msg = await createMessage(toList, config.sendGridFrom, ccList, 'Add Skill Mail', temp);
  let msg = await createMessage(toList1, config.sendGridFrom, ccList, `Yay! You just added ${templateObject.addSkillData.skillName} to ${templateObject.addSkillData.empid} !`, temp);
  let msg1 = await createMessage(toList, config.sendGridFrom, ccList, `${templateObject.name} just added ${templateObject.addSkillData.skillName} to ${templateObject.addSkillData.empid}`, temp1);
    
mailResponse = await sendMailSg(msg);
 mailResponse = await sendMailSg(msg1);  
// create to anc cc
  return true;
  // create message

  // send mail
};

//pinnterest model mail
const buyNowMailTemplate = async (templateObject) => {
  
  const productData = templateObject.responseDetails?.legend || templateObject.responseDetails?.pro

  var jsonString = JSON.stringify(productData);
  var encodedPackageString = encodeURIComponent(jsonString);


  const productType =
    templateObject.responseDetails.name == `${templateObject.buyNowData.product_title} Pro`
      ? 'Pro'
      : 'Legend';

  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
      .card-container {
        display: flex;
        justify-content: center;
        flex-direction: column;
        width: 305px;
        height: 365px;
        background-color: #f5f5f5;
        position: relative;
      }

      .text-container {
        background-color: #ffffff;
        border-bottom-left-radius: 13px;
        border-bottom-right-radius: 13px;
        width: 266px;
      }
      .uper-text {
        font-weight: bolder;
        font-size: 20px;
        text-align: left;40
        margin-left: 10px;
        padding-top: 20px;
        color: #000000;
      }
      .lower-text {
        color: #b1b1b1;
        font-weight: bold;
        text-align: left;
        margin-left: 10px;
        margin-top: -10px;
      }
      .inner-card-container {
        margin: 0px 27px;
      }
      /* .pin{
                height: 30px;
                width: 30px;
                background-color: red;
            } */

      .image {
        margin-bottom: -24px;
        border-top-left-radius: 13px;
        border-top-right-radius: 13px;
      }
      .pinlogo {
        width: 45px;
        border-radius: 25px;
        cursor: pointer !important;
        float: right !important;
    margin-top: 15%  !important;
      }
      .upperlogopin {
        position: absolute;
        top: 6%;
        right: 6%;
        z-index: 999;
        
      }
      a {
        text-decoration: none;
      }
    </style>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Hi <span id="user">${templateObject.user.name}</span>,
              <br/>
              <p style="font-size: 0.95rem;">
              Cheers! We are thrilled to inform you that you have successfully taken the first step towards the purchase of the  ${productType} package of ${productData.name}! 
              </p>
              <div class="card-container">
             <div class="upperlogopin">
        
      </div>
      <div class="inner-card-container1">
        <div class="inner-card-container">
          <a href="https://automation.unilever.com/product_details/${templateObject.buyNowData.product_url}?id=${templateObject.buyNowData.product_id}&function=${templateObject.buyNowData.catalog_products}&product_name=${templateObject.buyNowData.product_title}&tagline=${templateObject.buyNowData.tagline}&video=${templateObject.buyNowData.product_video}&packages=${encodedPackageString}">
            <img src="${templateObject.buyNowData.product_images}" class="image" width="266px" height="170px"
          /></a>

          <div class="text-container">
            <p class="uper-text">${templateObject.buyNowData.product_title}</p>
            <p class="lower-text">
            ${templateObject.buyNowData.product_description}
            </p>
          </div>
        </div>
      </div>
    </div>
              <p>Here are the details of your purchase </p>
              <br/>
              <ul style="list-style-type: none">
                <li>Product Name : ${productData.name}</li>
                <li>Package Selected : ${productType}</li>
                <li>Implementation Cost : <span style="color: ${productData.priceTextColor}">€${productData.price}K</span></li>
                <li>Run Cost : ${productData.yearOnYear}</li>
              </ul>   
              <p style="font-size: 0.95rem;">
                In case of any concerns or queries, write to us at mailto:hap@unilever.com.
              </p>
              <p>
              Thankyou for choosing the ${productType} package of ${productData.name}. We look forward to a successful partnership as you implement this powerful solution. </p>
 <p>
    Regards,<br>
    <img src="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/logo/HAP_Logo_Blue_Transparent_BG_Horizontal_SVG.png"style="height:auto;width:auto"/>
    <br>
    <a href="hap@unilever.com" style="height:auto">hap@unilever.com</a><br/>
    <a href="https://automation.unilever.com/" style="height:auto">https://automation.unilever.com/</a>
</p>
           </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const HAPbuyNowMailTemplate = async (templateObject) => {
  console.log('2168>>>>HAOPbuyNowMailTemplate');
  const productType =
    templateObject.responseDetails.product_title == `${templateObject.buyNowData.product_title} Pro`
      ? 'Pro'
      : 'Legend';

  const productData = templateObject.responseDetails?.legend || templateObject.responseDetails?.pro

  var jsonString = JSON.stringify(productData);
  var encodedPackageString = encodeURIComponent(jsonString);

  let templates = [];

  for (const value of templateObject.toHAPList) {
    let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p><strong>Hi <span id="user">${value.email},</strong></span>
              <br/>
              <p style="font-size: 0.95rem;">
                ${productData.name} was purchased by ${templateObject.user.name}. 
              </p>
              <div >
<a href="https://automation.unilever.com/product_details/${templateObject.buyNowData.product_url}?id=${templateObject.buyNowData.product_id}&function=${templateObject.buyNowData.catalog_products}&product_name=${templateObject.buyNowData.product_title}&tagline=${templateObject.buyNowData.tagline}&video=${templateObject.buyNowData.product_video}&packages=${encodedPackageString}"> <img src="${templateObject.buyNowData.product_images}" /></a>.
              </div>
              <p>Please find your purchase details below: </p>
              <br/>
              <ul style="list-style-type: none">
                <li>User Name : ${templateObject.user.name}</li>
                <li>Email ID : ${templateObject.user.email}</li>
                <li>Product Name : ${productData.name}</li>
                <li>Package Selected : ${productType}</li>
                <li>Implementation Cost : <span style="color: ${productData.priceTextColor}">€${productData.price}K</span> </li>
              </ul>   
              <p style="font-size: 0.95rem;">
                Please reach out to the ${templateObject.user.name} immediately. .
              </p>
 <p>
    Regards,<br>
    <img src="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/logo/HAP_Logo_Blue_Transparent_BG_Horizontal_SVG.png"style="height:auto;width:auto"/>
    <br>
    <a href="hap@unilever.com" style="height:auto">hap@unilever.com</a><br/>
    <a href="https://automation.unilever.com/" style="height:auto">https://automation.unilever.com/</a>
</p>
           </p>
           </p>
          </div>      
      </section>
  </body>
  </html>`;
    templates.push(templ);
  }
  return templates;
};

const buyNowMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;

  let toList = [];
  toList.push(email);

  let toHAPList = [];
  toHAPList.push({
    // name: "Veshaly varshney",
    // email: "mailto:veshaly.varshney@unilever.com"
    email: 'hap@unilever.com',
  });

  let HAPemail = toHAPList.map((HAPitem) => HAPitem.email);

  const { list, ...items } = mailData.responseDetails;

  

  let ccList = [];
  //mailto:cclist.push('hap@unilever.com');

  let templateObject = {
    user: mailData.user,
    buyNowData: mailData.buyNowData,
    responseDetails: mailData.responseDetails,
    list: list,
    toHAPList: toHAPList,
  };

  let temp = await buyNowMailTemplate(templateObject);

  let HAPtemp = await HAPbuyNowMailTemplate(templateObject);

  //console.log('to list ', toList);
  //console.log('cc list', ccList);

  // create template
  let msg = await createMessage(
    toList,
    'hap@unilever.com',
    ccList,
    `Hi ${name}, ${mailData.responseDetails.legend?.name || mailData.responseDetails.pro?.name} purchase is successful!`,
    temp
  );
  mailResponse = await sendMailSg(msg);

  for (const template of HAPtemp) {
    let HAPmsg = await createMessage(
      HAPemail,
      'hap@unilever.com',
      ccList,
      `New purchase of ${mailData.responseDetails.legend?.name || mailData.responseDetails.pro?.name} made by ${name}!`,
      template
    );
    mailResponse = await sendMailSg(HAPmsg);
    //console.log(template);
  }

  // create to anc cc
  return true;
  // create message

  // send mail
};
const pinMailTemplate = async (templateObject) => {

  var jsonString = JSON.stringify(templateObject.responsePackage);
  var encodedPackageString = encodeURIComponent(jsonString);

  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
      .card-container {
        display: flex;
        justify-content: center;
        flex-direction: column;
        width: 305px;
        height: 365px;
        background-color: #f5f5f5;
        position: relative;
      }

      .text-container {
        background-color: #ffffff;
        border-bottom-left-radius: 13px;
        border-bottom-right-radius: 13px;
        width: 266px;
      }
      .uper-text {
        font-weight: bolder;
        font-size: 20px;
        text-align: left;
        margin-left: 10px;
        padding-top: 20px;
        color: #000000;
      }
      .lower-text {
        color: #b1b1b1;
        font-weight: bold;
        text-align: left;
        margin-left: 10px;
        margin-top: -10px;
      }
      .inner-card-container {
        margin: 0px 27px;
      }
      /* .pin{
                height: 30px;
                width: 30px;
                background-color: red;
            } */

      .image {
        margin-bottom: -24px;
        border-top-left-radius: 13px;
        border-top-right-radius: 13px;
      }
      .pinlogo {
        width: 45px;
        border-radius: 25px;
        cursor: pointer !important;
        float: right !important;
    margin-top: 15%  !important;
      }
      .upperlogopin {
        position: absolute;
        top: 6%;
        right: 6%;
        z-index: 999;
        
      }
      a {
        text-decoration: none;
      }
    </style>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>
              <div id="user">
                Dear ${templateObject.tosentmailUsername},
              </div>
              <p style="font-size: 0.95rem;">We are excited to inform that 
              ${templateObject.user.name} has just pinned an exciting product,
                ${templateObject.pinData.product_title} to your HAP Profile.
                ${templateObject.message ? `<p style= "font-size: 0.95rem;"><b>${templateObject.message}</b></p>` : ""} This new addition brings your total pins to ${templateObject.userPins} pins.
                You can check out this pin by visiting <a href = "https://automation.unilever.com/products/${templateObject.tosentmail}&showMyOtherPins=true">profile page</a>
              </p>
              <div class="card-container">
             <div class="upperlogopin">
        
      </div>
      <div class="inner-card-container1">
        <div class="inner-card-container">
          <a href="https://automation.unilever.com/product_details/${templateObject.pinData.product_url}?id=${templateObject.pinData.product_id}&function=${templateObject.pinData.catalog_products}&product_name=${templateObject.pinData.product_title}&tagline=${templateObject.pinData.tagline}&video=${templateObject.pinData.product_video}&packages=${encodedPackageString}">
            <img src="${templateObject.pinData.product_images}" class="image" width="266px" height="170px"
          /></a>

          <div class="text-container">
            <p class="uper-text">${templateObject.pinData.product_title}</p>
            <p class="lower-text">
            ${templateObject.pinData.product_description}
            </p>
          </div>
        </div>
      </div>
    </div>
              
              <p style ="font-size: 0.95rem;">
              Your pinned products are open for all to view. You can further pin this product to relevant people within Unilever who you might want to initiate a discussion with, or functional/tech/business SMEs, 
              or decision makers looking for tech capabilities to transform their area. It is as easy as just pinning the product using the pin on your personal page & it would add this pin to their personal automation page.  
              </p>
              <p>Thankyou for being part of our vibrant network! </p>
 <p>
    Regards,<br>
    <img src="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/logo/HAP_Logo_Blue_Transparent_BG_Horizontal_SVG.png"style="height:auto;width:auto"/>
    <br>
    <a href="hap@unilever.com" style="height:auto">hap@unilever.com</a><br/>
    <a href="https://automation.unilever.com/" style="height:auto">https://automation.unilever.com/</a>
</p>
                  
              </p>
          </div>      
      </section>
  </body>
  </html>`;

  return templ;
};
const pinMail = async (mailData) => {
  // get user email
  let email = mailData.user.email;

  let toList = [];

  let ccList = [email];
  ccList.push('hap@unilever.com');

  let pinPromises = []; // Store promises for sending emails

  toList.push(mailData.targetUser.email);
  // Create a template object for each recipient
  let templateObject = {
    user: mailData.user,
    pinData: mailData.pinData,
    tosentmail: mailData.targetUser.email, // Set the recipient's email
    tosentmailUsername: mailData.targetUser.name,
    userPins: mailData.userPins,
    message: mailData.message,
    responsePackage : mailData.responsePackage
  };

  let temp = await pinMailTemplate(templateObject);

  // Create the message for each recipient
  let msg = await createMessage(
    [mailData.targetUser.email], // Send to the current recipient
    'hap@unilever.com',
    ccList,
    `Hey ${mailData.targetUser.name}, ${mailData.pinData.product_title} has been pinned on your HAP website!`,
    temp
  );

  // Store the promise for sending the email
  pinPromises.push(sendMailSg(msg));

  // Wait for all emails to be sent
  await Promise.all(pinPromises);

  // All emails have been sent
  return true;
};

const ShareMailTemplate = async (templateObject) => {


  var jsonString = JSON.stringify(templateObject.responsePackage);
  var encodedPackageString = encodeURIComponent(jsonString);

  const shareEmails = Array.isArray(templateObject.shareEmail)
    ? templateObject.shareEmail
    : [templateObject.shareEmail];
  const templates = [];
  for (const shareEmail of shareEmails) {
     for(const subArray of templateObject.user){

      for(const value of subArray){

    let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
      .card-container {
        display: flex;
        justify-content: center;
        flex-direction: column;
        width: 305px;
        height: 365px;
        background-color: #f5f5f5;
        position: relative;
      }

      .text-container {
        background-color: #ffffff;
        border-bottom-left-radius: 13px;
        border-bottom-right-radius: 13px;
        width: 266px;
      }
      .uper-text {
        font-weight: bolder;
        font-size: 20px;
        text-align: left;
        margin-left: 10px;
        padding-top: 20px;
        color: #000000;
      }
      .lower-text {
        color: #b1b1b1;
        font-weight: bold;
        text-align: left;
        margin-left: 10px;
        margin-top: -10px;
      }
      .inner-card-container {
        margin: 87px 27px;
        display:grid
      }
      /* .pin{
                height: 30px;
                width: 30px;
                background-color: red;
            } */

      .image {
        margin-bottom: -24px;
        border-top-left-radius: 13px;
        border-top-right-radius: 13px;
        height:170px;
      }
      .pinlogo {
        width: 45px;
        border-radius: 25px;
        top: 0;
        right: 20px;
        float: right;
        position: relative;
        transform: translate(-23px, 13px);
      }
      .upperlogopin {
        position: relative !important;
        top: 6%;
        right: 6%;
        z-index: 999;
        
      }
      a {
        text-decoration: none;
    height: 170px;
    display: block;
      }
    </style>
  </head>
  <body>

  <section id="containt" style="background-color: #deeaf6;">     
  <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
      <p>
      <div id="user">
        Dear ${value.name},
      </div>
      <p style="font-size: 0.95rem;">We have some exciting news for you! 
      ${templateObject.sender.name} has shared a remarkable product,
        ${templateObject.shareData.product_title} that he/she believe you will find intriguing.
        ${templateObject.message ? `<p style= "font-size: 0.95rem;"><b>${templateObject.message}</b></p>` : ""}
        You can check out this product by clicking on the following link:
      </p>
      <div class="card-container">
     <div class="upperlogopin">
     
     <div class="inner-card-container1">
     
     <div class="inner-card-container">
     <a href="https://automation.unilever.com/product_details/${templateObject.shareData.product_url}?id=${templateObject.shareData.product_id}&function=${templateObject.shareData.catalog_products}&product_name=${templateObject.shareData.product_title}&tagline=${templateObject.shareData.tagline}&video=${templateObject.shareData.product_video}&packages=${encodedPackageString}">
     <img src="${templateObject.shareData.product_images}" class="image" width="266px" height="170px"/></a>
    
    

  <div class="text-container">
    <p class="uper-text">${templateObject.shareData.product_title}</p>
    <p class="lower-text">
    ${templateObject.shareData.product_description}
    </p>
  </div>
  </div>
</div>
</div>
</div>
      
      <p style ="font-size: 0.95rem;">
      This product is shared through private message, ensuring that your interactions remain confidential. 
      You have the option to pin or share this product with relevant individuals withing Unilever network who you 
      might want to initiate a discussion with, or functional/tech/business SMEs, or decision makers looking 
      for tech capabilities to transform their area. 
      </p>
      <p>Thankyou for being part of our exclusive network! </p>
 <p>
    Regards,<br>
    <img src="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/logo/HAP_Logo_Blue_Transparent_BG_Horizontal_SVG.png"style="height:auto;width:auto"/>
    <br>
    <a href="hap@unilever.com" style="height:auto">hap@unilever.com</a><br/>
    <a href="https://automation.unilever.com/" style="height:auto">https://automation.unilever.com/</a>
</p>          
      </p>
  </div>      
</section>
  </body>
  </html>`;
    templates.push(templ);
  }
     }
   }

  return templates;
};

const shareMail = async (mailData) => {
  // get user email and name
  let toList = [];

  for (const subArray of mailData.user) {
    for (const value of subArray) {
      toList.push(value.email);
   

  let ccList = [mailData.sender.email];

  ccList.push('hap@unilever.com');

  let templateObjects = {
    shareEmails: mailData.shareEmail, // Extract email addresses
    user: mailData.user,
    sender: mailData.sender,
    shareData: mailData.shareData,
    message: mailData.message,
    responsePackage : mailData.responsePackage
  };

  let templates = await ShareMailTemplate(templateObjects);

  // create the email message
  for (const template of templates) {
    let msg = await createMessage(
      toList,
      'hap@unilever.com',
      ccList,
      `${value.name} thinks you will be interested in ${mailData.shareData.product_title}`,
      template
    );

    console.log(template);

    // send the email
    mailResponse = await sendMailSg(msg);
  }
}
}

  return true;
};

const orderMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
  </head>
  <body>
      <section id="containt" style="background-color: #deeaf6;">     
          <div class="text" style="padding: 0.1rem;padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
              <p>Dear <span id="user">${templateObject.name}</span>, <p></p>
              <p style="font-size: 0.95rem;"> Thank you for your purchase with us under <span id="OrderID">${templateObject.randomData.orderID}</span> 
              <br>Your Employee Twin “Mimi” is now ready to use, please follow the attached instruction to start using it today!
              <br>For more information, please reach out to Hyper automation Employee Twin team at <a href="ml_sa_ind_et_support@unilever.com">@ML_SA_IND_ET_Support</a>
              </p>
<p>
<a href="https://bnlwestgunileveraf01092.blob.core.windows.net/botstorevideo/botDocuments/User%20Manual.docx">Click here to download the attached document</a>
</p>
              <p>
                  Regards,<br/>
                  Automation Factory
              </p>
          </div>      
      </section>
  </body>
  </html>`;
  return templ;
};

const orderMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;

  let toList = ["anshu.rani@unilever.com","binay.kumar@unilever.com"];
  toList.push(email);
  let ccList = [];
  ccList.push(config.sendGridFrom);
  let templateObject = {
    name: name,
    randomData: mailData.randomData,
    
  };

  let temp = await orderMailTemplate(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(toList, config.sendGridFrom, ccList, `Your Digital Twin is ready! - ${templateObject.randomData.orderID} `, temp);
  mailResponse = await sendMailSg(msg);
  // create to anc cc
  return true;
  // create message

  // send mail
};


const productOrderMailTemplate = async (templateObject) => {
  let templ = `<html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
  </head>
  <body style="background-color: #deeaf6;">
      <section id="content" style="padding: 0.1rem; padding-left: 1rem; font-style: initial; font-weight: 500; word-spacing: 0.2rem;">
          <p>Dear <span id="user">${templateObject.name}</span>,</p>
          <p style="font-size: 0.95rem;">Thank you for your purchase with us under <span id="OrderID">${templateObject.randomData.orderID}</span></p>
          <br/>
          <p>Below are the details of your order:-</p>
          <br/>
          <table>
              <tr>
                  <th>Order ID</th>
                  <td>${templateObject.randomData.orderID}</td>
              </tr>
              <tr>
                  <th>Employee Twin Name</th>
                  <td>${templateObject.randomData.ET_name}</td>
              </tr>
          </table>
          <p>Regards,<br/>Automation Factory</p>
      </section>
  </body>
  </html>
  `;
  return templ;
};

const productOrderMail = async (mailData) => {
  //get user email
  let email = mailData.user.email;
  let name = mailData.user.name;

  let toList = ["anshu.rani@unilever.com","binay.kumar@unilever.com","ritik.bhadauria@unilever.com"];
  toList.push(email);

  let ccList = [];
  ccList.push(config.sendGridFrom);

  let templateObject = {
    name: name,
    email: email,
    randomData: mailData.mailData,
  };

  let temp = await productOrderMailTemplate(templateObject);
  console.log('to list ', toList);
  console.log('cc list', ccList);

  // create template
  let msg = await createMessage(toList, config.sendGridFrom, ccList, `Thank You for Your Order! Order Confirmation Inside. Order id - ${templateObject.randomData.orderID} `, temp);
  console.log("msgmsgmsgmsg",msg)
  mailResponse = await sendMailSg(msg);
  // create to anc cc
  return true;
  // create message
  // send mail
};


export default {
  createMailerThroughFile,
  sendMail,
  contactMailer,
  getThisBotMailer,
  createApproveBotMailer,
  getEl,
  exportMailerData,
  submitAnIdeaMailer,
  updateBotMailer,
  devopsMailer,
  feedbackMail,
  randomMail,
//ordermail API
orderMail,
CheckoutMail,
deleteSkillMail,
  addSkillMail,
buyNowMail,
  pinMail,
  shareMail,
  costControlMail,
  productOrderMail
};

