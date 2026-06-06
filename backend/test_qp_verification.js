const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function verify() {
  try {
    console.log('1. Registering new test user for QP...');
    const email = `qp_testuser_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'QP Test User',
      email,
      password: 'password123',
      school: 'QP Verification School'
    });
    const token = regRes.data.token;
    console.log('✅ Registered successfully. Token received.');

    console.log('\n2. Initiating Question Paper Generation (Mock/Real AI)...');
    const genRes = await axios.post(`${API_URL}/qp/generate`, {
      board: 'CBSE',
      grade: 'Grade 10',
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      questionsCount: 5,
      totalMarks: 25,
      difficulty: 'medium'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const paperId = genRes.data.paperId;
    console.log(`✅ Generation started! ID: ${paperId}`);
    
    console.log('Polling question paper status...');
    let status = 'generating';
    let paperData = null;
    while (status === 'generating' || status === 'pending') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const statusRes = await axios.get(`${API_URL}/qp/${paperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      paperData = statusRes.data.paper;
      status = paperData.status;
      console.log(`...status: ${status}`);
    }

    if (status === 'completed') {
      console.log('✅ Question Paper generated successfully!');
      console.log(`Generated ${paperData.questions.length} questions.`);
      console.log(`Q1: ${paperData.questions[0].text} (${paperData.questions[0].marks} Marks)`);

      console.log('\n3. Initiating Student Answer Sheet Evaluation...');
      const evalRes = await axios.post(`${API_URL}/qp/${paperId}/evaluate`, {
        studentName: 'Rahul Sharma',
        studentAnswersText: 'Answer 1: A quadratic equation is of the form ax^2 + bx + c = 0 where a is not zero.\n\nAnswer 2: The roots of the equation can be found using the formula x = (-b +- sqrt(d))/2a.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const evalId = evalRes.data.evaluationId;
      console.log(`✅ Evaluation started! ID: ${evalId}`);

      console.log('Polling evaluation status...');
      let evalStatus = 'generating';
      let evalData = null;
      while (evalStatus === 'generating' || evalStatus === 'pending') {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const statusRes = await axios.get(`${API_URL}/qp/evaluations/${evalId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        evalData = statusRes.data.evaluation;
        evalStatus = evalData.status;
        console.log(`...eval status: ${evalStatus}`);
      }

      if (evalStatus === 'completed') {
        console.log('✅ Sheet evaluated successfully!');
        console.log(`Student Score: ${evalData.totalMarks}/${evalData.maxMarks}`);
        console.log(`Feedback Summary: ${evalData.feedbackSummary}`);
        console.log('🎉 QP & Evaluation Backend: FULLY PASSED');
      } else {
        console.error(`❌ Evaluation failed with status: ${evalStatus}`);
      }

    } else {
      console.error(`❌ Paper generation failed with status: ${status}`);
    }

  } catch (err) {
    console.error('❌ Verification failed:', err.response?.data || err.message);
  }
}

verify();
