import axios from "axios";
import API from '../api/api'

// ============================
// DASHBOARD STATS
// ============================

export const getStats = async () => {
  const response = await API.get("/stats");

  return response.data;
};

// ============================
// CREATE DEPARTMENT
// ============================

export const createDepartment = async (data) => {
  const response = await API.post(
    "/department",
    data
  );

  return response.data;
};

// ============================
// CREATE COURSE
// ============================

export const createCourse = async (data) => {
  const response = await API.post(
    "/course",
    data
  );

  return response.data;
};

// ============================
// CREATE USER
// ============================

export const createUser = async (data) => {
  const response = await API.post(
    "/user",
    data
  );

  return response.data;
};

// ============================
// GET DEPARTMENTS
// ============================

export const getDepartments = async () => {
  const response = await API.get(
    "/departments"
  );

  return response.data;
};

// ============================
// GET TEACHERS
// ============================

export const getTeachers = async () => {
  const response = await API.get(
    "/teachers"
  );

  return response.data;
};

// ============================
// GET COURSES
// ============================

export const getCourses = async () => {
  const response = await API.get(
    "/courses"
  );

  return response.data;
};

export const assignTeacher = async (data) => {
  const response = await API.post(
    "/assign-teacher",
    data
  );

  return response.data;
};