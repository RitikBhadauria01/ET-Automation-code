import catchAsync from '../helpers/catchAsync';
import twinValidations from '../helpers/twinValidation';
import softSkill from '../models/softSkill';
import ResponseObject from '../helpers/responseObjectClass';
import employeeTwin from '../models/employeeTwin'; 

{/*const createSkill = catchAsync(async (req, res, next) => {
    const table = await softSkill.sync();
    for (const prop in req.body) {
        // Generate soft skill id
        if (prop == 'softSkillID') {
            let softSkill_id = await table.findAll().then(row => {
                const row_length = row.length;
                let previous_id = row[row_length - 1].dataValues.id;
                return previous_id + 1;
            }).catch((err) => { console.log('pppppp', err) });
            if (typeof (softSkill_id) == 'undefined') {
                softSkill_id = 'SS00001';
            } else if (softSkill_id < 10) {
                softSkill_id = 'SS0000' + softSkill_id;
            } else if (softSkill_id < 100) {
                softSkill_id = 'SS000' + softSkill_id;
            } else if (softSkill_id < 1000) {
                softSkill_id = 'SS00' + softSkill_id;
            } else if (softSkill_id < 10000) {
                softSkill_id = 'SS0' + softSkill_id;
            } else {
                softSkill_id = 'SS' + softSkill_id;
            }
            req.body[prop] = softSkill_id;
        }
        // end Generate soft skill id
    }
    try {
        // data to database table: soft_skills
        let skill = softSkill.build(req.body);
        let skillCreateResponse = await skill.save();
        let skillCreateMessage = 'Successfully created';
        res.send(new ResponseObject(200, skillCreateMessage, true, skillCreateResponse));
    } catch (err) {
        console.log(err, "errpr++++");
    }
});*/}

const createSkill = catchAsync(async (req, res, next) => {
    try {
      const table = await softSkill.sync();
      for (const prop in req.body) {
        // Generate soft skill id
        if (prop === 'softSkillID') {
          let softSkill_id = await table.findAll().then(rows => {
            const row_length = rows.length;
            let previous_id = rows[row_length - 1].dataValues.softSkillID;
            let numberAfterPrefix = parseInt(previous_id.substring(5)); // Extract the number after "SS000"
            return numberAfterPrefix + 1;
          }).catch(err => {
            console.log('Error while fetching data', err);
            throw err; // Rethrow the error to the catch block
          });
  
          const prefix = "SS000";
          softSkill_id = prefix + softSkill_id.toString().padStart(2, '0'); // Format the new ID
  
          req.body[prop] = softSkill_id;
        }
        // End Generate soft skill id
      }
  
      // data to database table: soft_skills
      let skill = softSkill.build(req.body);
      let skillCreateResponse = await skill.save();
      let skillCreateMessage = 'Successfully created';
      res.send(new ResponseObject(200, skillCreateMessage, true, skillCreateResponse));
    } catch (err) {
      console.log('Error while creating skill:', err);
      // Handle the error appropriately (e.g., send an error response to the client)
      // res.status(500).json({ message: 'Error while creating skill', error: err });
    }
  });

const searchSkill = catchAsync(async (req, res, next) => {
    const table = await softSkill.sync();
    const result = await table.findAll({
        where: {
            employeeTwinID: req.query.empTwinId,
        },
    });
    if (result.length > 0) {
        let skillCreateMessage = "Successfully found";
        res.send(new ResponseObject(200, skillCreateMessage, true, result));
    }else{
        let skillCreateMessage = "No skill available";
        res.send(new ResponseObject(500, skillCreateMessage, true));
    }
});
//////delete skill 
const deleteSkill = catchAsync(async (req, res, next) => {
    const employeeTwin_table = await employeeTwin.employeeTwin.sync();
    const table = await softSkill.sync();

    let { employeeTwinID, skillID } = req.body; 
    const emp_result = await employeeTwin_table.findAll({
        where: {
            employeeTwinID: employeeTwinID
        }
    }).then(data => {
        let skill;
        skill = data[0].softSkill;
        skill = skill.split(',');
        let softSkill_arr = [];
        let value = true;
        skill.forEach((id, i) => {
            if (id != skillID) {
                softSkill_arr.push(id);
            } else {
                value = false;
            }
        });
        if (value) {
            res.send(new ResponseObject(500, 'skill id not match', false));
        }
        softSkill_arr = softSkill_arr.toString();
        let respose = employeeTwin.employeeTwin.update(
            { softSkill: softSkill_arr },
            { where: { employeeTwinID: employeeTwinID } }
        );
        const result = table.destroy({
            where: {
                softSkillID: req.body.skillID,
            },
        }).then(deleteRow => {
            let message = "Delete successfully";
            if (deleteRow == 0) {
                let message = `Skill id not exist.`;
                res.send(new ResponseObject(500, message, true, deleteRow));
            } else {
                res.send(new ResponseObject(200, message, true, deleteRow));
            }
        }).catch(err => {
            console.log('err', err);
        });
    });
});

const getSoftSkill = catchAsync(async (req, res, next) => {
    const table = await softSkill.sync();
    const result = await table.findAll({
        where: {
            softSkillID: req.query.softSkillID,
        },
    });
    if (result.length > 0) {
        let skillCreateMessage = "Successfully found";
        res.send(new ResponseObject(200, skillCreateMessage, true, result));
    }else{
        let skillCreateMessage = "No skill available";
        res.send(new ResponseObject(500, skillCreateMessage, true));
    }
});

export default {
    createSkill,
    searchSkill,
    deleteSkill,
    getSoftSkill
}

