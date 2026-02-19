import { edgeDbAvailable } from "@dub/prisma/edge";
import { prisma } from "@dub/prisma";
import { conn } from "./connection";

interface QueryResult {
  id: string;
  name: string;
  image: string | null;
  discountId: string;
  amount: number;
  type: "percentage" | "flat";
  maxDuration: number | null;
  couponId: string | null;
  couponTestId: string | null;
  groupId: string | null;
  tenantId: string | null;
}

// Get enrollment info for a partner in a program
export const getPartnerEnrollmentInfo = async ({
  partnerId,
  programId,
}: {
  partnerId: string | null;
  programId: string | null;
}) => {
  if (!partnerId || !programId) {
    return {
      partner: null,
      discount: null,
    };
  }

  if (!edgeDbAvailable) {
    if (process.env.NEXT_RUNTIME === "edge")
      return { partner: null, discount: null };
    const enrollment = await prisma.programEnrollment.findUnique({
      where: { partnerId_programId: { partnerId, programId } },
      include: {
        partner: { select: { id: true, name: true, image: true } },
        discount: true,
      },
    });
    if (!enrollment) return { partner: null, discount: null };
    return {
      partner: enrollment.partner,
      discount: enrollment.discount,
    };
  }

  const { rows } = await conn.execute<QueryResult>(
    `SELECT 
      Partner.id,
      Partner.name,
      Partner.image,
      Discount.id as discountId,
      Discount.amount,
      Discount.type,
      Discount.maxDuration,
      Discount.couponId,
      Discount.couponTestId,
      ProgramEnrollment.groupId,
      ProgramEnrollment.tenantId
    FROM ProgramEnrollment
    LEFT JOIN Partner ON Partner.id = ProgramEnrollment.partnerId
    LEFT JOIN Discount ON Discount.id = ProgramEnrollment.discountId
    WHERE ProgramEnrollment.partnerId = ? AND ProgramEnrollment.programId = ? LIMIT 1`,
    [partnerId, programId],
  );

  const result =
    rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

  if (!result) {
    return {
      partner: null,
      discount: null,
    };
  }

  return {
    partner: {
      id: result.id,
      name: result.name,
      image: result.image,
      groupId: result.groupId,
      tenantId: result.tenantId,
    },
    discount: result.discountId
      ? {
          id: result.discountId,
          amount: result.amount,
          type: result.type,
          maxDuration: result.maxDuration,
          couponId: result.couponId,
          couponTestId: result.couponTestId,
        }
      : null,
  };
};
