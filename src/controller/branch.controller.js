import { prisma } from '../config/prisma.js';

// Admin creates Branch
export const createBranch = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({ message: 'Name and address are required' });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        adminId
      }
    });

    return res.status(201).json({
      message: 'Branch created successfully',
      branch
    });
  } catch (error) {
    console.error('createBranch error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin's own branches
export const listMyBranches = async (req, res) => {
  try {
    const adminId = req.user.id;

    const branches = await prisma.branch.findMany({
      where: { adminId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            staffRole: true,
            status: true
          }
        }
      }
    });

    // Separate staff and members
    const branchesWithSeparatedUsers = branches.map(branch => ({
      ...branch,
      staff: branch.users.filter(user => user.role === 'STAFF'),
      members: branch.users.filter(user => user.role === 'MEMBER'),
      users: undefined // remove the combined users array
    }));

    return res.json({ branches });
  } catch (error) {
    console.error('listMyBranches error', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
