import ContactSubmission from '../models/ContactSubmission.js';

export const createContactSubmission = async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const phone = String(req.body?.phone || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const message = String(req.body?.message || '').trim();

    if (!name || !phone || !email || !message) {
      return res.status(400).json({ message: 'Name, phone, email, and message are required.' });
    }

    const submission = await ContactSubmission.create({
      name,
      phone,
      email,
      message,
      status: 'pending'
    });

    res.status(201).json({
      message: 'Your message has been submitted successfully.',
      submission
    });
  } catch (error) {
    console.error('Create contact submission error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getContactSubmissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const status = String(req.query.status || 'all').trim().toLowerCase();
    const search = String(req.query.search || '').trim();
    const filter = {};

    if (status === 'pending') {
      filter.$or = [
        { status: 'pending' },
        { status: { $exists: false } },
        { status: null },
        { status: '' }
      ];
    } else if (status === 'resolved') {
      filter.status = 'resolved';
    }

    if (search) {
      const searchConditions = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: searchConditions }
        ];
        delete filter.$or;
      } else {
        filter.$or = searchConditions;
      }
    }

    const [submissions, total] = await Promise.all([
      ContactSubmission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContactSubmission.countDocuments(filter)
    ]);

    const normalizedSubmissions = submissions.map((submission) => ({
      ...submission,
      status: submission.status || 'pending'
    }));

    res.json({
      submissions: normalizedSubmissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateContactSubmissionStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || '').trim().toLowerCase();

    if (!['pending', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const submission = await ContactSubmission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Contact submission not found.' });
    }

    res.json({
      message: 'Contact submission status updated successfully.',
      submission
    });
  } catch (error) {
    console.error('Update contact submission status error:', error);
    res.status(400).json({ message: error.message });
  }
};
