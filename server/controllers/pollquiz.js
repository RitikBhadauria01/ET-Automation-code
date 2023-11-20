import catchAsync from '../helpers/catchAsync';
import sequelize from "../helpers/Sequalize";
//import polls from '../models/poll';
import pollAnswer from '../models/pollAnswer';
import pollQuestion from '../models/pollQuestion';
import ResponseObject from '../helpers/responseObjectClass';



const pollQuiz = async (req, res, next) => {
    try {
      const data = req.body.data;
  
      for (const questionObj of data) {
        const { questions, options } = questionObj;
  
        const question = await pollQuestion.create({ questions: questions });
  
        for (const answer of options) {
          await pollAnswer.create({
            label: answer.label, // Change "label" to "text"
            value: answer.value,
            QuestionId: question.id,
          });
        }
      }
  
      res.status(201).json({ 
        data: data,
        code: 200
        
       });
       // Calculate and send poll results after each question is submitted
    await getPollResults(req, res, next);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };


const getQuiz = async (req,res,next) => {
    try{
        const table = await pollQuestion.sync();
        const result = await table.findAll({});
        
        const questionsData = result.map((obj) => ({
            questions: obj.questions,
        }));
        
        const table1 = await pollAnswer.sync();
        const result1 = await table1.findAll({});
        
        const optionsData = result1.map((obj) => ({
            label: obj.label,
            value: obj.value,
        }));
        
        const responseData = questionsData.map((question, index) => ({
            questions: question.questions,
            options: optionsData.slice(index * 4, (index + 1) * 4),
        }));
        
        res.status(200).json({
            data: responseData,
            code: 200,
        });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
} 

const getPollResults = async (req, res, next) => {
    try {
      const questionTable = await pollQuestion.sync();
      const answerTable = await pollAnswer.sync();
  
      const questions = await questionTable.findAll({});
  
      const results = [];
  
      for (const question of questions) {
        const answers = await answerTable.findAll({
          where: { QuestionId: question.id },
        });
  
        const totalVotes = answers.reduce((total, answer) => total + answer.voteCount, 0);
  
        const percentages = answers.map((answer) => ({
          option: answer.label,
          percentage: totalVotes === 0 ? 0 : (answer.voteCount / totalVotes) * 100,
        }));
        console.log("94>>>>",percentages[0]);
  
        results.push({ question: question.questions, options: percentages });
      }
  
      res.status(200).json({
        data: results,
        code: 200,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  




  


export default { pollQuiz,getQuiz,getPollResults};
