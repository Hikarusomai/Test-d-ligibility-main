const TestSubmission = require('../models/TestSubmission');
const User = require('../models/User');

// @desc    Get all students with their test results (Admin only)
// @route   GET /api/admin/students
// @access  Admin
exports.getAllStudents = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            sortBy = 'completedAt',
            sortOrder = 'desc',
            status,
            minScore,
            maxScore,
            destinationCountry,
            originCountry,
            search
        } = req.query;

        // Build query
        const query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by score range
        if (minScore !== undefined || maxScore !== undefined) {
            query.score = {};
            if (minScore !== undefined) query.score.$gte = parseInt(minScore);
            if (maxScore !== undefined) query.score.$lte = parseInt(maxScore);
        }

        // Filter by destination country
        if (destinationCountry) {
            query.destinationCountry = { $regex: destinationCountry, $options: 'i' };
        }

        // Filter by origin country
        if (originCountry) {
            query.originCountry = { $regex: originCountry, $options: 'i' };
        }

        // Search in user data
        if (search) {
            const submissions = await TestSubmission.find(query)
                .populate('userId', 'email firstName lastName phone nationality')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

            const filtered = submissions.filter(sub => {
                const user = sub.userId;
                return (
                    user?.email?.toLowerCase().includes(search.toLowerCase()) ||
                    user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                    user?.lastName?.toLowerCase().includes(search.toLowerCase())
                );
            });

            // Pagination for filtered results
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedResults = filtered.slice(startIndex, endIndex);

            return res.json({
                success: true,
                students: paginatedResults.map(sub => ({
                    id: sub._id,
                    user: sub.userId,
                    originCountry: sub.originCountry,
                    destinationCountry: sub.destinationCountry,
                    score: sub.score,
                    status: sub.status,
                    completedAt: sub.completedAt,
                    createdAt: sub.createdAt
                })),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(filtered.length / limit),
                    totalResults: filtered.length,
                    resultsPerPage: parseInt(limit)
                }
            });
        }

        // Regular query without search
        const skip = (page - 1) * limit;

        const [submissions, total] = await Promise.all([
            TestSubmission.find(query)
                .populate('userId', 'email firstName lastName phone nationality')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(parseInt(limit)),
            TestSubmission.countDocuments(query)
        ]);

        res.json({
            success: true,
            students: submissions.map(sub => ({
                id: sub._id,
                user: sub.userId,
                originCountry: sub.originCountry,
                destinationCountry: sub.destinationCountry,
                score: sub.score,
                status: sub.status,
                completedAt: sub.completedAt,
                createdAt: sub.createdAt,
                answers: sub.answers
            })),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalResults: total,
                resultsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('❌ Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des étudiants'
        });
    }
};

// @desc    Get student details by ID (Admin only)
// @route   GET /api/admin/students/:id
// @access  Admin
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID invalide'
            });
        }

        const submission = await TestSubmission.findById(id)
            .populate('userId', 'email firstName lastName phone nationality');

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        res.json({
            success: true,
            student: {
                id: submission._id,
                user: submission.userId,
                originCountry: submission.originCountry,
                destinationCountry: submission.destinationCountry,
                answers: submission.answers,
                score: submission.score,
                analysis: submission.analysis,
                status: submission.status,
                completedAt: submission.completedAt,
                createdAt: submission.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'étudiant'
        });
    }
};

// @desc    Export all students to Excel (Admin only)
// @route   GET /api/admin/students/export/excel
// @access  Admin
exports.exportStudentsToExcel = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const { status, destinationCountry, minScore, maxScore } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (destinationCountry) {
            query.destinationCountry = { $regex: destinationCountry, $options: 'i' };
        }
        if (minScore !== undefined || maxScore !== undefined) {
            query.score = {};
            if (minScore !== undefined) query.score.$gte = parseInt(minScore);
            if (maxScore !== undefined) query.score.$lte = parseInt(maxScore);
        }

        // Fetch all submissions with filters
        const submissions = await TestSubmission.find(query)
            .populate('userId', 'email firstName lastName phone nationality')
            .sort({ completedAt: -1 });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Étudiants');

        // Define columns
        worksheet.columns = [
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Prénom', key: 'firstName', width: 20 },
            { header: 'Nom', key: 'lastName', width: 20 },
            { header: 'Téléphone', key: 'phone', width: 15 },
            { header: 'Nationalité', key: 'nationality', width: 20 },
            { header: 'Pays d\'origine', key: 'originCountry', width: 25 },
            { header: 'Pays de destination', key: 'destinationCountry', width: 25 },
            { header: 'Score', key: 'score', width: 10 },
            { header: 'Statut', key: 'status', width: 15 },
            { header: 'Date de completion', key: 'completedAt', width: 20 },
            { header: 'Date de création', key: 'createdAt', width: 20 }
        ];

        // Add data rows
        submissions.forEach(submission => {
            const user = submission.userId || {};
            worksheet.addRow({
                email: user.email || 'N/A',
                firstName: user.firstName || 'N/A',
                lastName: user.lastName || 'N/A',
                phone: user.phone || 'N/A',
                nationality: user.nationality || 'N/A',
                originCountry: submission.originCountry,
                destinationCountry: submission.destinationCountry,
                score: submission.score,
                status: submission.status,
                completedAt: new Date(submission.completedAt).toLocaleString('fr-FR'),
                createdAt: new Date(submission.createdAt).toLocaleString('fr-FR')
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="students_${new Date().toISOString().split('T')[0]}.xlsx"`
        );

        // Send workbook
        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'export Excel'
        });
    }
};

// @desc    Get statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Admin
exports.getStatistics = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'candidate' });
        const totalSubmissions = await TestSubmission.countDocuments();

        const statusBreakdown = await TestSubmission.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const averageScore = await TestSubmission.aggregate([
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: '$score' }
                }
            }
        ]);

        const topDestinations = await TestSubmission.aggregate([
            {
                $group: {
                    _id: '$destinationCountry',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        res.json({
            success: true,
            statistics: {
                totalStudents,
                totalSubmissions,
                statusBreakdown: statusBreakdown.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                averageScore: averageScore[0]?.avgScore || 0,
                topDestinations: topDestinations.map(item => ({
                    country: item._id,
                    count: item.count
                }))
            }
        });
    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};
