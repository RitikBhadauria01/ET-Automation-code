import catchAsync from '../helpers/catchAsync';

import Mailer from '../models/Mailer';
import ResponseObject from '../helpers/responseObjectClass';
import multiparty from 'multiparty';
import excelToJson from 'convert-excel-to-json';
import { Op } from 'sequelize';
import sgMail from '@sendgrid/mail';
import config from '../../config/env';
import Excel from 'exceljs';

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
  let userEmail = mailData.user.email;
  let cc = [];
  let toMail = [];
  toMail.push(userEmail);
  let GetMailResposne = await getMailTo(mailData.mailData.leadPlatform, mailData.mailData.cluster);
  console.log('el------------', GetMailResposne);

  for (let i = 0; i < GetMailResposne.length; i++) {
    cc.push(GetMailResposne[i]);
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
    console.log('ccList  ----', cc);
    console.log('to list --', toMail);

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
    console.log('mail response ---', mailResponse);
  }
  return true;
};

const sendMailSg = async (msg) => {
  console.log('inside send mail sq', msg);
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
        console.error(error);
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
  console.log('mail data -', mailData.mailData);
  console.log('common cc --', config.ccSendGrid);
  console.log('user email --', userEmail);

  let cc = [];
  if (mailData.mailData.UserEmail !== userEmail) {
    // cc.push(mailData.mailData.UserEmail);
    // cc.push(mailData.mailData.UserEmail, config.ccSendGrid);
  } else {
    // cc.push(config.ccSendGrid);
  }

  console.log('cc----', cc);

  let toMail = [];
  console.log('To mail --', mailData.mailData.UserEmail);
  toMail.push(userEmail);
  // create template
  let template = createTemplate(mailData);

  // create msg
  let msg = await createMessage(
    toMail,
    config.sendGridFrom,
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
                  <p style="font-size: 0.95rem;">The First Level GFCF approval for Bot ID <span id="botId">${templateData.botID}</span> with process name <span id="prcoessName">${templateData.processName}</span> is completed. Your final approval is pending.</p>  
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

const submitAnIdeaMailer = async (mailData) => {
  console.log('mail data submit an idea ---', mailData);
  //get user email
  let { email, name } = mailData.userData;

  let toList = [];
  toList.push(email);
  let ccList = [];
  // ccList.push(config.ccSendGrid);
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
  var ccList = [];
  let toList = [];
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
      console.log(templateData);
      emailTemplate = getMailerTemplate('firstLevelGpmHasApproved', templateData);
      msg = await createMessage(
        toList,
        config.sendGridFrom,
        ccList,
        'Final GPM Approval - [' + botID + ']',
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
            toList,
            config.sendGridFrom,
            ccList,
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
      emailTemplate = getMailerTemplate('firstGfcfHasApproved', templateData);
      msg = await createMessage(
        toList,
        config.sendGridFrom,
        ccList,
        'Final GFCF Approval - [' + botID + ']',
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
  let ccList = [];
  let toList = [];
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
      processName,
    } = mailData.botData;
    templateData.botID = botID;
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
    console.log('cc list ', ccList);
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
    console.log('cc list', ccList);
    console.log('to list ---', toList);
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
    config.sendGridFrom,
    ccList,
    `New Bot Approval - ${templateData.botID}`,
    getTempl
  );
  console.log('Sending create bot email' + JSON.stringify(msg));
  mailResponse = await sendMailSg(msg);
  console.log('mail response ---', mailResponse);
  // send mail
  return true;
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
};
